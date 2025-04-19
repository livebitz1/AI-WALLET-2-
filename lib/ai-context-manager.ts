import { AIMessage } from "./utils";
import { getTokenPrice } from "./crypto-api";
import { connectionManager } from "./connection-manager";
import { PublicKey, LAMPORTS_PER_SOL, TokenAccountBalancePair } from "@solana/web3.js";
import { TOKEN_METADATA } from "./token-metadata";
import { recordInteraction } from "./ai-training";
import { WalletDataProvider } from './wallet-data-provider';
import { TransactionMemoryManager } from './transaction-memory';

// Context history for better AI interactions
type UserProfile = {
  expertiseLevel: "beginner" | "intermediate" | "advanced";
  preferredTokens: string[];
  interests: string[];
  lastCommand?: string;
  lastIntent?: string;
  lastTransactions?: Array<{type: string, timestamp: number}>;
};

// Store context per user/session
const userProfiles = new Map<string, UserProfile>();

// Maximum stored messages
const MAX_HISTORY_LENGTH = 10;
const messageHistory = new Map<string, AIMessage[]>();

// Cache wallet balances to reduce RPC calls
const walletBalanceCache = new Map<string, {
  data: { 
    solBalance: number, 
    tokenBalances: Array<{symbol: string, balance: number, usdValue?: number}>
  },
  timestamp: number
}>();

const BALANCE_CACHE_TTL = 30000; // 30 seconds cache lifetime

export class AIContextManager {
  private sessionId: string;
  private walletAddress: string | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
    if (!userProfiles.has(sessionId)) {
      userProfiles.set(sessionId, {
        expertiseLevel: "beginner",
        preferredTokens: ["SOL", "USDC"],
        interests: []
      });
    }
    if (!messageHistory.has(sessionId)) {
      messageHistory.set(sessionId, []);
    }
  }
  
  setWalletAddress(address: string | null): void {
    // Clear balance cache if wallet changes
    if (this.walletAddress !== address && this.walletAddress !== null) {
      this.clearBalanceCache();
    }
    this.walletAddress = address;
  }
  
  clearBalanceCache(): void {
    if (this.walletAddress) {
      walletBalanceCache.delete(this.walletAddress);
    }
  }
  
  /**
   * Initialize with specific wallet address (useful for testing)
   */
  initializeWithWalletAddress(address: string): void {
    console.log(`Initializing AI context with wallet address: ${address}`);
    this.setWalletAddress(address);
    
    // Prefetch wallet data to warm up cache
    this.prefetchWalletData(address).catch(err => {
      console.error("Failed to prefetch wallet data:", err);
    });
  }
  
  /**
   * Prefetch wallet data to warm up cache
   */
  private async prefetchWalletData(address: string): Promise<void> {
    if (!address) return;
    
    try {
      console.log(`Prefetching wallet data for ${address}`);
      const walletData = await WalletDataProvider.getCompleteWalletData(address);
      
      console.log(`Prefetched data: ${walletData.solBalance} SOL, ${walletData.tokens.length} tokens, ${walletData.recentTransactions.length} transactions`);
      
      // Cache the result
      walletBalanceCache.set(address, {
        data: {
          solBalance: walletData.solBalance,
          tokenBalances: walletData.tokens.filter(t => t.symbol !== 'SOL').map(t => ({
            symbol: t.symbol,
            balance: t.balance,
            usdValue: t.usdValue,
            decimals: t.decimals
          }))
        },
        timestamp: Date.now()
      });

      // Initialize transaction memory
      await TransactionMemoryManager.initializeMemory(address);
    } catch (error) {
      console.error("Error prefetching wallet data:", error);
    }
  }
  
  /**
   * Fetch wallet balances with retry mechanism and caching
   */
  async getWalletBalances(): Promise<{ 
    solBalance: number, 
    tokenBalances: Array<{symbol: string, balance: number, usdValue?: number}> 
  }> {
    if (!this.walletAddress) {
      return { solBalance: 0, tokenBalances: [] };
    }
    
    // Check cache first
    const cached = walletBalanceCache.get(this.walletAddress);
    if (cached && Date.now() - cached.timestamp < BALANCE_CACHE_TTL) {
      return cached.data;
    }
    
    try {
      // Use the new WalletDataProvider for more reliable data
      const walletData = await WalletDataProvider.getWalletData(this.walletAddress);
      
      // Format the data to match the expected structure
      const result = {
        solBalance: walletData.solBalance,
        tokenBalances: walletData.tokens
          .filter(t => t.symbol !== 'SOL')
          .map(t => ({
            symbol: t.symbol,
            balance: t.balance,
            usdValue: t.usdValue || undefined,
            decimals: t.decimals
          }))
      };
      
      // Cache the result
      walletBalanceCache.set(this.walletAddress, {
        data: result,
        timestamp: Date.now()
      });
      
      // Reset retry counter on success
      this.retryCount = 0;
      
      return result;
    } catch (error) {
      console.error("Error getting wallet balances:", error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log("Using expired cache data due to error");
        return cached.data;
      }
      
      return { solBalance: 0, tokenBalances: [] };
    }
  }
  
  /**
   * Add message to conversation history and update profile
   */
  addMessage(message: AIMessage): void {
    const messages = messageHistory.get(this.sessionId) || [];
    messages.push(message);
    
    // Keep history at manageable size
    if (messages.length > MAX_HISTORY_LENGTH) {
      messages.shift();
    }
    
    messageHistory.set(this.sessionId, messages);
    
    // Update user profile based on message content
    if (message.role === "user") {
      this.updateUserProfile(message.content);
    }
    
    // Record interactions for training
    if (message.role === "user") {
      const matchedIntent = this.detectIntent(message.content);
      recordInteraction(message.content, matchedIntent, true);
    }
  }
  
  /**
   * Detect likely intent from user message for analytics
   */
  private detectIntent(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    // Simple pattern matching for common intents
    if (lowerMessage.match(/swap|exchange|trade|convert/)) return "swap";
    if (lowerMessage.match(/balance|portfolio|holding/)) return "balance";
    if (lowerMessage.match(/history|transaction|recent|activity/)) return "history";
    if (lowerMessage.match(/price|worth|value|cost/)) return "price";
    if (lowerMessage.match(/trend|market|chart/)) return "market";
    
    return null;
  }
  
  getMessages(): AIMessage[] {
    return messageHistory.get(this.sessionId) || [];
  }
  
  getUserProfile(): UserProfile {
    return userProfiles.get(this.sessionId) || {
      expertiseLevel: "beginner",
      preferredTokens: ["SOL", "USDC"],
      interests: []
    };
  }
  
  // Analyze message to update user profile
  private updateUserProfile(message: string): void {
    const profile = this.getUserProfile();
    const lowerMessage = message.toLowerCase();
    
    // Check for expertise level indicators
    const advancedTerms = [
      "liquidity pool", "impermanent loss", "yield farming", "amm", "slippage tolerance",
      "tokenomics", "staking", "gdp", "market cap", "mev", "jito", "flashbots",
      "arbitrage", "derivative", "options", "futures", "tvl", "order book", "liquidity",
      "consensus", "mempool", "gas optimization", "validator"
    ];
    
    const intermediateterms = [
      "defi", "staking", "wallet", "blockchain", "transaction", "nft",
      "token", "crypto", "exchange", "market", "trading", "network",
      "gas fee", "chain", "block"
    ];
    
    for (const term of advancedTerms) {
      if (lowerMessage.includes(term)) {
        profile.expertiseLevel = "advanced";
        break;
      }
    }
    
    // Check intermediate terms only if not already marked as advanced
    if (profile.expertiseLevel !== "advanced") {
      for (const term of intermediateterms) {
        if (lowerMessage.includes(term)) {
          profile.expertiseLevel = "intermediate";
          break;
        }
      }
    }
    
    // Extract mentioned tokens - expanded recognition
    const tokenPatterns = [
      /\b(sol|solana)\b/i,
      /\b(usdc|usd coin)\b/i,
      /\b(usdt|tether)\b/i,
      /\b(bonk)\b/i,
      /\b(jup|jupiter)\b/i,
      /\b(jto)\b/i,
      /\b(ray|raydium)\b/i,
      /\b(wif|dogwifhat)\b/i,
      /\b(meme)\b/i
    ];
    
    for (const pattern of tokenPatterns) {
      const match = lowerMessage.match(pattern);
      if (match && match[1]) {
        // Normalize token names
        let token;
        const matchLower = match[1].toLowerCase();
        if (matchLower === "solana") token = "SOL";
        else if (matchLower === "usd coin") token = "USDC"; 
        else if (matchLower === "tether") token = "USDT";
        else if (matchLower === "jupiter") token = "JUP";
        else if (matchLower === "raydium") token = "RAY";
        else if (matchLower === "dogwifhat") token = "WIF";
        else token = match[1].toUpperCase();
        
        // Update preferred tokens list
        if (!profile.preferredTokens.includes(token)) {
          // Move to front if already exists, add if doesn't
          const index = profile.preferredTokens.indexOf(token);
          if (index !== -1) {
            profile.preferredTokens.splice(index, 1);
          }
          profile.preferredTokens.unshift(token);
          
          // Keep list manageable
          if (profile.preferredTokens.length > 5) {
            profile.preferredTokens.pop();
          }
        }
      }
    }
    
    // Track interests - expanded categories
    const interestPatterns = [
      { pattern: /\b(defi|yield|farming|staking|liquidity|pool|swap|exchange|dex)\b/i, interest: "defi" },
      { pattern: /\b(nft|collectible|art|pfp|jpeg|collection|creator|rarity)\b/i, interest: "nft" },
      { pattern: /\b(dao|governance|voting|proposal|vote|community|token holder)\b/i, interest: "governance" },
      { pattern: /\b(meme|dog coin|pepe|doge|shib|bonk|wif)\b/i, interest: "meme coins" },
      { pattern: /\b(trade|trading|chart|candle|technical|indicator|resistance|support)\b/i, interest: "trading" },
      { pattern: /\b(security|safety|hack|exploit|vulnerability|risk|protect)\b/i, interest: "security" }
    ];
    
    for (const { pattern, interest } of interestPatterns) {
      if (pattern.test(lowerMessage) && !profile.interests.includes(interest)) {
        profile.interests.push(interest);
      }
    }
    
    // Update profile
    userProfiles.set(this.sessionId, profile);
  }
  
  // Generate a comprehensive context for AI processing
  async generateAIContext(): Promise<{
    systemPrompt: string;
    recentMessages: AIMessage[];
    suggestedTopics: string[];
    walletData?: any; // Add wallet data to context
  }> {
    const profile = this.getUserProfile();
    const messages = this.getMessages();
    const { solBalance, tokenBalances } = await this.getWalletBalances();
    
    // Fetch transaction history if wallet is connected
    let recentTransactions = [];
    if (this.walletAddress) {
      try {
        // Use the new provider to get transaction history
        recentTransactions = await WalletDataProvider.getRecentTransactions(this.walletAddress, 5);
      } catch (error) {
        console.error("Failed to fetch transactions for AI context:", error);
      }
    }
    
    // Generate personalized system prompt
    let systemPrompt = `You are a Web3 AI assistant specializing in Solana blockchain. `;
    
    // Add wallet info with more details
    if (this.walletAddress) {
      systemPrompt += `The user's wallet (${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}) is connected with ${solBalance.toFixed(4)} SOL`;
      
      // Add SOL USD value if available
      try {
        const solPrice = await getTokenPrice("SOL");
        if (solPrice) {
          const usdValue = solBalance * solPrice;
          systemPrompt += ` (≈$${usdValue.toFixed(2)})`;
        }
      } catch (e) {
        // Silently continue if price fetch fails
      }
      
      systemPrompt += `. `;
      
      // Add token balances with more details
      if (tokenBalances.length) {
        systemPrompt += `They also have `;
        systemPrompt += tokenBalances.map(t => {
          let tokenInfo = `${t.balance} ${t.symbol}`;
          if (t.usdValue) {
            tokenInfo += ` (≈$${t.usdValue.toFixed(2)})`;
          }
          return tokenInfo;
        }).join(", ");
        systemPrompt += `. `;
      }
    } else {
      systemPrompt += `The user hasn't connected their wallet yet. Guide them to connect their wallet to access full functionality. `;
    }
    
    // Personalization based on profile with more depth
    systemPrompt += `Based on your interactions, you appear to be a ${profile.expertiseLevel} crypto user. `;
    
    if (profile.preferredTokens.length) {
      systemPrompt += `You've shown interest in ${profile.preferredTokens.join(", ")}. `;
    }
    
    if (profile.interests.length) {
      systemPrompt += `Your interests include ${profile.interests.join(", ")}. `;
    }
    
    // Add appropriate level of detail based on expertise
    if (profile.expertiseLevel === "advanced") {
      systemPrompt += `I'll provide detailed technical information about DeFi protocols, tokenomics, and market analysis. I'll assume you understand concepts like liquidity pools, impermanent loss, and yield farming strategies. `;
    } else if (profile.expertiseLevel === "intermediate") {
      systemPrompt += `I'll balance technical details with clear explanations, focusing on practical applications of blockchain technology and investment strategies. `;
    } else {
      systemPrompt += `I'll explain crypto concepts in simple terms and provide guidance on basic operations, avoiding technical jargon when possible. `;
    }
    
    // Add functional reminders
    systemPrompt += `When providing swap recommendations, ensure you check the user's actual token balances first. If the user doesn't have enough of a token, suggest alternatives based on their current holdings. Always convert crypto slang to clear instructions.`;
    
    // Add transaction history context
    if (recentTransactions.length > 0) {
      systemPrompt += `\n\nRecent transactions: `;
      recentTransactions.forEach((tx, i) => {
        const date = new Date(tx.timestamp).toLocaleDateString();
        systemPrompt += `\n${i+1}. ${date}: ${tx.type === 'swap' ? 
          `Swapped ${tx.amount} ${tx.fromToken} to ${tx.toToken}` : 
          tx.type === 'transfer' ? `Transferred ${tx.amount} ${tx.fromToken}` :
          `${tx.type} of ${tx.amount} ${tx.fromToken}`}`;
      });
      systemPrompt += `\n`;
    }

    // Add memory capabilities to system prompt
    systemPrompt += `\n\nI can remember your transaction history and answer questions about your past activities. You can ask things like:
- "What were my transactions last week?"
- "How much did I spend on SOL last month?"
- "Show my failed transactions"
- "When was my last swap?"`;
    
    // Generate suggested topics based on profile
    const suggestedTopics = [];
    
    // Add token-specific suggestions
    if (profile.preferredTokens.length) {
      suggestedTopics.push(`Tell me about ${profile.preferredTokens[0]}`);
      
      // If they have balance for this token, offer to swap it
      const preferredToken = profile.preferredTokens[0];
      if (preferredToken === "SOL" && solBalance > 0.05) {
        suggestedTopics.push(`Swap 0.05 SOL to USDC`);
      } else if (preferredToken !== "SOL") {
        const tokenBalance = tokenBalances.find(t => t.symbol === preferredToken);
        if (tokenBalance && tokenBalance.balance > 0) {
          // Only suggest swaps for tokens they actually own
          const swapAmount = tokenBalance.balance * 0.1; // Suggest 10% of balance
          suggestedTopics.push(`Swap ${swapAmount.toFixed(2)} ${preferredToken} to SOL`);
        } else {
          // Suggest exploring this token if they don't own it
          suggestedTopics.push(`Swap SOL to ${preferredToken}`);
        }
      }
    }
    
    // Add interest-specific suggestions
    for (const interest of profile.interests) {
      switch(interest) {
        case "defi":
          suggestedTopics.push("What are the best DeFi protocols on Solana?");
          break;
        case "nft":
          suggestedTopics.push("How do NFTs work on Solana?");
          break;
        case "meme coins":
          suggestedTopics.push("Tell me about trending meme coins");
          break;
        case "governance":
          suggestedTopics.push("How do DAOs work on Solana?");
          break;
        case "trading":
          suggestedTopics.push("What are the best DEXes on Solana?");
          break;
        case "security":
          suggestedTopics.push("How can I keep my wallet secure?");
          break;
      }
      
      // We only need one interest-based suggestion
      if (suggestedTopics.length >= 3) break;
    }
    
    // Add general suggestions if we need more
    if (suggestedTopics.length < 4) {
      // Always offer balance check if wallet is connected
      if (this.walletAddress && !suggestedTopics.includes("Check my balance")) {
        suggestedTopics.push("Check my balance");
      }
      
      // Add general suggestions if needed
      const generalSuggestions = [
        "What can you help me with?",
        "Show my transaction history",
        "What are current gas fees?",
        "What's a good beginner token?",
        "How do I stake SOL?",
        "Explain Solana's consensus model"
      ];
      
      // Add enough general suggestions to get 4 total
      for (const suggestion of generalSuggestions) {
        if (suggestedTopics.length < 4) {
          suggestedTopics.push(suggestion);
        } else {
          break;
        }
      }
    }
    
    return {
      systemPrompt,
      recentMessages: messages.slice(-5), // Just the most recent messages for context
      suggestedTopics: suggestedTopics.slice(0, 4), // Limit to 4 suggestions
      walletData: this.walletAddress ? {
        address: this.walletAddress,
        solBalance,
        tokenBalances,
        recentTransactions,
        // Add memory capability flag
        memoryEnabled: true
      } : null
    };
  }
}
