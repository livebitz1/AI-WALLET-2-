import { SwapIntent } from "@/lib/utils";
import { fetchTokenPrice, TokenPriceData } from "@/lib/token-price";
import { getWalletHistory } from "@/lib/wallet-history";
import { estimateSwapValue, getTokenPrice } from "@/lib/price-oracle";

// Enhanced token information database with market trends
const TOKEN_INFO = {
  "SOL": {
    name: "Solana",
    decimals: 9,
    description: "Native token of the Solana blockchain, known for high throughput and low fees",
    useCases: "Transaction fees, staking, governance, DeFi collateral",
    price_range: "$20-$100 historically",
    trend_indicators: ["Ecosystem growth", "Developer activity", "DeFi TVL"],
    category: "L1 blockchain",
    year_launched: 2020,
    market_sentiment: "Bullish after 2023 recovery",
  },
  "USDC": {
    name: "USD Coin",
    decimals: 6,
    description: "A regulated stablecoin pegged to the US dollar issued by Circle",
    useCases: "Store of value, trading pairs, cross-border payments, yield farming",
    price_range: "~$1.00 (stablecoin)",
    trend_indicators: ["Regulatory compliance", "Corporate adoption"],
    category: "Stablecoin",
    year_launched: 2018,
    issuer: "Circle",
  },
  "USDT": {
    name: "Tether",
    decimals: 6,
    description: "The largest stablecoin by market cap, pegged to the US dollar",
    useCases: "Trading pairs, store of value, global payments",
    price_range: "~$1.00 (stablecoin)",
    trend_indicators: ["Exchange reserves", "Regulatory scrutiny"],
    category: "Stablecoin",
    year_launched: 2014,
    issuer: "Tether Limited",
  },
  "BONK": {
    name: "Bonk",
    decimals: 5,
    description: "A community-focused Solana meme coin with the Shiba Inu dog mascot",
    useCases: "Community engagement, tipping, NFT purchases on Solana",
    price_range: "High volatility meme token",
    trend_indicators: ["Social media mentions", "Community engagement", "Whale movements"],
    category: "Meme coin",
    year_launched: 2022,
    market_sentiment: "Cyclical hype patterns",
  },
  "JUP": {
    name: "Jupiter",
    decimals: 6,
    description: "Governance token for Jupiter, Solana's leading DEX aggregator",
    useCases: "Governance, fee sharing, liquidity provision incentives",
    price_range: "Trending upward since 2024 launch",
    trend_indicators: ["Trading volume", "TVL growth", "Protocol revenue"],
    category: "DEX token",
    year_launched: 2024,
    market_sentiment: "Strong as leading Solana DEX",
  },
  "JTO": {
    name: "Jito",
    decimals: 9,
    description: "Governance token for Jito's MEV infrastructure on Solana",
    useCases: "Governance, staking, revenue sharing",
    price_range: "Stable with growth potential",
    trend_indicators: ["Validator adoption", "Solana block production stats"],
    category: "Infrastructure token",
    year_launched: 2023,
    market_sentiment: "Technical adoption focus",
  },
  "RAY": {
    name: "Raydium",
    decimals: 6,
    description: "AMM and liquidity provider on Solana with concentrated liquidity features",
    useCases: "Trading, liquidity provision, yield farming",
    price_range: "DeFi token with moderate volatility",
    trend_indicators: ["TVL", "Trading fees generated", "New pool launches"],
    category: "DEX token",
    year_launched: 2021,
    market_sentiment: "Recovering alongside Solana DeFi ecosystem",
  },
  "PYTH": {
    name: "Pyth Network",
    decimals: 6,
    description: "Oracle protocol providing real-time market data across blockchains",
    useCases: "Governance, staking for data validation",
    trend_indicators: ["Cross-chain integrations", "Data provider partnerships"],
    category: "Oracle token",
    year_launched: 2023,
    market_sentiment: "Growth with DeFi adoption",
  },
  "MEME": {
    name: "Memecoin",
    decimals: 6,
    description: "Multi-chain meme token focused on internet culture and humor",
    useCases: "Community engagement, memetic value",
    price_range: "Highly volatile, follows meme cycles",
    trend_indicators: ["Social media virality", "Celebrity mentions", "New exchange listings"],
    category: "Meme coin",
    year_launched: 2023,
    market_sentiment: "Follows broader meme coin trends",
  },
  "WIF": {
    name: "Dogwifhat",
    decimals: 6,
    description: "Solana meme coin featuring a dog wearing a pink hat, went viral in 2023",
    useCases: "Community status, NFT integration",
    price_range: "Extremely volatile, reached major peaks in 2023-2024",
    trend_indicators: ["Twitter mentions", "Influencer activity", "New listings"],
    category: "Meme coin",
    year_launched: 2023,
    market_sentiment: "One of Solana's most successful meme coins",
  }
};

// General knowledge base for non-crypto topics
const GENERAL_KNOWLEDGE = {
  "greetings": [
    "Hello! How can I help with your Web3 journey today?",
    "Hi there! I'm your AI assistant for Web3 and crypto. What can I do for you?",
    "Hey! Ready to explore the blockchain world together?"
  ],
  "thanks": [
    "You're welcome! Happy to assist with your crypto needs.",
    "Anytime! Let me know if you need anything else related to blockchain.",
    "Glad I could help! Feel free to ask more about Web3."
  ],
  "identity": [
    "I'm an AI assistant specialized in Web3 and cryptocurrency. While I can chat about general topics, I'm most knowledgeable about blockchain technology, Solana, and token swaps.",
    "I'm your Web3 AI Wallet assistant. I can help with token swaps, provide crypto information, and chat about various topics, though my expertise is in blockchain."
  ],
  "capabilities": [
    "I can help you swap tokens on Solana, check token prices and balances, provide information about cryptocurrencies, and chat about various topics. Try asking me to 'Swap 1 SOL to USDC' or 'Tell me about NFTs'."
  ]
};

// Handle casual conversations not related to specific operations
const CONVERSATION_PATTERNS = {
  "greeting": [
    /^(?:hi|hello|hey|howdy|greetings|good\s+(?:morning|afternoon|evening)|what'?s\s+up)/i
  ],
  "farewell": [
    /^(?:bye|goodbye|see\s+you|farewell|later|have\s+a\s+(?:good|nice|great)\s+(?:day|night|evening))/i
  ],
  "thanks": [
    /^(?:thanks|thank\s+you|thx|ty|appreciate\s+(?:it|you))/i
  ],
  "identity": [
    /(?:who|what)\s+are\s+you/i,
    /tell\s+(?:me\s+)?about\s+yourself/i
  ],
  "capabilities": [
    /what\s+can\s+you\s+do/i,
    /help\s+me\s+with/i,
    /how\s+does\s+this\s+(?:work|app\s+work)/i
  ],
  "joke": [
    /tell\s+(?:me\s+)?a\s+(?:joke|crypto\s+joke)/i
  ]
};

// Crypto jokes for fun interactions
const CRYPTO_JOKES = [
  "Why don't programmers like nature? It has too many bugs and no debugging tools!",
  "Why did the blockchain go to therapy? It had too many trust issues!",
  "How many Bitcoin miners does it take to change a lightbulb? 21 million, but only one gets the reward!",
  "Why did the crypto investor go to the dentist? Because of the tooth decay... just like their portfolio in a bear market!",
  "What do you call a cryptocurrency investor who finally breaks even? A miracle!"
];

// Keep track of live token price data
let cachedTokenPrices: Record<string, TokenPriceData> = {};

// More extensive operations in DeFi
const OPERATIONS = {
  "swap": {
    description: "Exchange one token for another",
    patterns: [
      /swap\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /convert\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|into)\s+(\w+)/i,
      /exchange\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /trade\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /change\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|into|for)\s+(\w+)/i,
      /(\d+\.?\d*)\s+(\w+)\s+(?:to|into|for)\s+(\w+)/i,
      // Add patterns for "all" keyword
      /swap\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /convert\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|into)\s+(\w+)/i,
      /exchange\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /trade\s+(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
    ],
    handler: async (match: RegExpMatchArray, context: any) => {
      // Handle "all" keyword pattern
      const allPattern = /(?:all|everything|all\s+my)\s+(\w+)\s+(?:to|into|for)\s+(\w+)/i;
      if (match[0].match(allPattern)) {
        const allMatch = match[0].match(allPattern);
        if (allMatch) {
          const [_, fromToken, toToken] = allMatch;
          const normalizedFromToken = fromToken.toUpperCase();
          const normalizedToToken = toToken.toUpperCase();
          
          // Validate tokens
          if (!TOKEN_INFO[normalizedFromToken]) {
            return {
              message: `I don't recognize "${fromToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
              intent: null
            };
          }
          
          if (!TOKEN_INFO[normalizedToToken]) {
            return {
              message: `I don't recognize "${toToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
              intent: null
            };
          }
          
          // Determine amount based on balance
          let amount = "0";
          if (normalizedFromToken === "SOL" && context.walletConnected) {
            // Keep 0.01 SOL for fees
            amount = Math.max(0, context.balance - 0.01).toFixed(4);
          } else if (context.walletConnected) {
            // Find token balance
            // This assumes context has tokenBalances
            const tokenBalance = context?.tokenBalances?.find(
              (t: any) => t.symbol === normalizedFromToken
            );
            amount = tokenBalance ? tokenBalance.balance.toString() : "0";
          }
          
          return {
            message: `I'll help you swap all your ${normalizedFromToken} (${amount}) to ${normalizedToToken}. I'll prepare this transaction for your approval.`,
            intent: {
              action: "swap",
              amount,
              fromToken: normalizedFromToken,
              toToken: normalizedToToken,
              percentage: "100%"
            }
          };
        }
      }
      
      // Handle regular amount pattern
      const [_, amount, fromToken, toToken] = match;
      const normalizedFromToken = fromToken.toUpperCase();
      const normalizedToToken = toToken.toUpperCase();
      
      // Validate tokens
      if (!TOKEN_INFO[normalizedFromToken]) {
        return {
          message: `I don't recognize "${fromToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }
      
      if (!TOKEN_INFO[normalizedToToken]) {
        return {
          message: `I don't recognize "${toToken}" as a supported token. Currently I support: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }

      // Check balance for SOL swaps
      if (
        normalizedFromToken === "SOL" && 
        context.walletConnected &&
        parseFloat(amount) > context.balance
      ) {
        return {
          message: `I notice you want to swap ${amount} SOL, but your current balance is only ${context.balance.toFixed(4)} SOL. Would you like to try a smaller amount?`,
          intent: null
        };
      }
      
      // Add price estimation
      try {
        const { estimatedValue, priceImpact, trend } = estimateSwapValue(
          normalizedFromToken,
          normalizedToToken,
          amount
        );
        
        const fromTokenPrice = getTokenPrice(normalizedFromToken);
        const toTokenPrice = getTokenPrice(normalizedToToken);
        
        // Format the message with price data
        let priceMessage = `Based on current rates, ${amount} ${normalizedFromToken} (≈$${(parseFloat(amount) * fromTokenPrice).toFixed(2)}) should get you approximately ${estimatedValue.toFixed(6)} ${normalizedToToken}`;
        
        // Add trend info
        if (trend === "up") {
          priceMessage += `. ${normalizedToToken} has been trending upward recently.`;
        } else if (trend === "down") {
          priceMessage += `. ${normalizedToToken} has been trending downward recently.`;
        } else {
          priceMessage += `. ${normalizedToToken} price has been stable recently.`;
        }
        
        // Add price impact warning if significant
        if (priceImpact > 0) {
          priceMessage += ` Note: This swap may have a price impact of approximately ${priceImpact.toFixed(1)}%.`;
        }
        
        // Custom response with token and price information
        const response = `I'll help you swap ${amount} ${normalizedFromToken} to ${normalizedToToken}. ${priceMessage} I'll prepare this transaction for your approval.`;
        
        return {
          message: response,
          intent: {
            action: "swap",
            amount,
            fromToken: normalizedFromToken,
            toToken: normalizedToToken,
            estimatedValue: estimatedValue.toFixed(6)
          }
        };
      } catch (error) {
        // Fallback to basic response if price estimation fails
        console.error("Error estimating swap value:", error);
        const response = `I'll help you swap ${amount} ${normalizedFromToken} to ${normalizedToToken}. I'll prepare this transaction for your approval.`;
        
        return {
          message: response,
          intent: {
            action: "swap",
            amount,
            fromToken: normalizedFromToken,
            toToken: normalizedToToken
          }
        };
      }
    }
  },
  "balance": {
    description: "Check token balances",
    patterns: [
      /(?:check|show|what(?:'|i)?s\s+(?:my|the))\s+balance/i,
      /how\s+much\s+(?:\w+\s+)?(?:do\s+i\s+have|is\s+in\s+my\s+wallet)/i,
      /balance\s+(?:of|for)\s+my\s+(?:wallet|account)/i,
      /my\s+balance/i,
      /wallet\s+balance/i,
    ],
    handler: async (_: RegExpMatchArray, context: any) => {
      if (!context.walletConnected) {
        return {
          message: "Please connect your wallet first to check your balance.",
          intent: null
        };
      }
      
      // Try to get SOL price
      let priceInfo = "";
      try {
        const now = Date.now();
        const isCacheValid = cachedTokenPrices["SOL"] &&
                            (now - cachedTokenPrices["SOL"].timestamp < 60000);
        
        let solPrice;
        if (!isCacheValid) {
          solPrice = await fetchTokenPrice("SOL");
          if (solPrice) {
            cachedTokenPrices["SOL"] = {
              price: solPrice,
              timestamp: now
            };
          }
        } else {
          solPrice = cachedTokenPrices["SOL"].price;
        }
        
        if (solPrice) {
          const dollarValue = context.balance * solPrice;
          priceInfo = ` (≈$${dollarValue.toFixed(2)})`;
        }
      } catch (error) {
        console.error("Error fetching SOL price:", error);
      }
      
      return {
        message: `Your current wallet balance is ${context.balance.toFixed(4)} SOL${priceInfo} (${context.walletAddress?.slice(0, 4)}...${context.walletAddress?.slice(-4)}). You can use this balance to swap tokens or perform other operations.`,
        intent: {
          action: "balance",
          address: context.walletAddress
        }
      };
    }
  },
  "tokenInfo": {
    description: "Get information about tokens",
    patterns: [
      /(?:tell|what|info|information)\s+(?:me|about|is)\s+(?:the\s+)?(?:token\s+)?(\w+)/i,
      /what\s+is\s+(\w+)(?:\s+token)?/i,
      /explain\s+(\w+)(?:\s+token)?/i,
      /(\w+)\s+info(?:rmation)?/i,
      /info\s+on\s+(\w+)/i,
    ],
    handler: async (match: RegExpMatchArray, _: any) => {
      const tokenSymbol = match[1].toUpperCase();
      const tokenInfo = TOKEN_INFO[tokenSymbol];
      
      if (!tokenInfo) {
        return {
          message: `I don't have information about ${match[1]}. Currently I have data on: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }
      
      // Try to get current price
      let priceInfo = "";
      try {
        const now = Date.now();
        const isCacheValid = cachedTokenPrices[tokenSymbol] &&
                            (now - cachedTokenPrices[tokenSymbol].timestamp < 60000);
        
        let tokenPrice;
        if (!isCacheValid) {
          tokenPrice = await fetchTokenPrice(tokenSymbol);
          if (tokenPrice) {
            cachedTokenPrices[tokenSymbol] = {
              price: tokenPrice,
              timestamp: now
            };
          }
        } else {
          tokenPrice = cachedTokenPrices[tokenSymbol].price;
        }
        
        if (tokenPrice) {
          priceInfo = `\n\nCurrent price: $${tokenPrice.toFixed(tokenSymbol === "BONK" || tokenSymbol === "WIF" ? 8 : 2)}`;
        }
      } catch (error) {
        console.error("Error fetching token price:", error);
      }
      
      // Build detailed token information
      let message = `${tokenSymbol} (${tokenInfo.name}): ${tokenInfo.description}. It has ${tokenInfo.decimals} decimals and is commonly used for ${tokenInfo.useCases}.`;
      
      // Add category and launch year
      message += `\n\nCategory: ${tokenInfo.category}`;
      if (tokenInfo.year_launched) {
        message += `, Launched: ${tokenInfo.year_launched}`;
      }
      
      // Add price range and market sentiment
      message += `\nPrice history: ${tokenInfo.price_range}`;
      if (tokenInfo.market_sentiment) {
        message += `\nMarket sentiment: ${tokenInfo.market_sentiment}`;
      }
      
      // Add price info if available
      message += priceInfo;
      
      // Add trend indicators
      if (tokenInfo.trend_indicators && tokenInfo.trend_indicators.length > 0) {
        message += `\n\nKey trend indicators: ${tokenInfo.trend_indicators.join(", ")}`;
      }
      
      return {
        message: message,
        intent: {
          action: "tokenInfo",
          token: tokenSymbol
        }
      };
    }
  },
  "price": {
    description: "Check token prices",
    patterns: [
      /(?:what(?:'|i)?s\s+(?:the|current))?\s*price\s+(?:of|for)\s+(\w+)/i,
      /how\s+much\s+(?:is|does)\s+(\w+)\s+cost/i,
      /(\w+)\s+price/i,
    ],
    handler: (match: RegExpMatchArray, _: any) => {
      const tokenSymbol = match[1].toUpperCase();
      
      if (!TOKEN_INFO[tokenSymbol]) {
        return {
          message: `I don't have price information for ${match[1]}. Currently I track: ${Object.keys(TOKEN_INFO).join(", ")}`,
          intent: null
        };
      }
      
      const price = getTokenPrice(tokenSymbol);
      const tokenInfo = TOKEN_INFO[tokenSymbol];
      
      return {
        message: `The current price of ${tokenSymbol} (${tokenInfo.name}) is approximately $${price.toFixed(tokenSymbol === "BONK" ? 8 : 2)} USD.`,
        intent: {
          action: "price",
          token: tokenSymbol,
          price: price
        }
      };
    }
  },
  "history": {
    description: "View transaction history",
    patterns: [
      /(?:show|view|get|check)\s+(?:my\s+)?(?:transaction|tx)\s+history/i,
      /(?:what|show)\s+(?:are|were)\s+my\s+(?:recent|last|previous)\s+transactions/i,
      /(?:my|wallet)\s+(?:transaction|tx)\s+history/i,
      /(?:recent|last|previous)\s+transactions/i,
      /what\s+(?:did|have)\s+i\s+(?:do|done|transact)/i,
    ],
    handler: async (_: RegExpMatchArray, context: any) => {
      if (!context.walletConnected) {
        return {
          message: "Please connect your wallet first to view your transaction history.",
          intent: null
        };
      }
      
      try {
        const history = await getWalletHistory(context.walletAddress);
        
        if (!history || history.length === 0) {
          return {
            message: "I couldn't find any recent transactions for your wallet. This could be because your wallet is new or the transaction history is not available through the API.",
            intent: {
              action: "history",
              success: false
            }
          };
        }
        
        // Format transaction history
        const formattedHistory = history.slice(0, 5).map((tx: any, index: number) => {
          let description = tx.description || "Unknown transaction";
          const date = new Date(tx.timestamp * 1000).toLocaleString();
          
          return `${index + 1}. ${description} - ${date}`;
        }).join("\n");
        
        const message = `Here are your most recent transactions:\n\n${formattedHistory}\n\nYou can see your full transaction history on Solana Explorer: https://explorer.solana.com/address/${context.walletAddress}`;
        
        return {
          message: message,
          intent: {
            action: "history",
            success: true,
            transactions: history.slice(0, 5)
          }
        };
      } catch (error) {
        console.error("Error fetching wallet history:", error);
        return {
          message: "I encountered an error while trying to fetch your transaction history. Please try again later.",
          intent: {
            action: "history",
            success: false
          }
        };
      }
    }
  },
  "marketTrends": {
    description: "Get market trends and insights",
    patterns: [
      /(?:what|how)(?:'s| is| are)\s+(?:the\s+)?(?:market|markets)(?:\s+doing)?/i,
      /market\s+(?:trend|trends|overview|update|sentiment)/i,
      /(?:what|which)\s+(?:token|tokens|coin|coins)(?:\s+are|\s+is)?\s+(?:trending|hot|popular)/i,
      /what\s+should\s+i\s+(?:buy|invest|trade)/i,
      /(?:crypto|token|coin)\s+recommendations/i,
    ],
    handler: async (_: RegExpMatchArray, context: any) => {
      // Simulated market trends - in a real implementation, this would call an API
      const trends = {
        overall: "The crypto market is showing a bullish pattern in the last 24 hours with most major assets gaining value.",
        topGainers: ["SOL (+8.2%)", "JUP (+15.4%)", "WIF (+23.1%)"],
        topLosers: ["Some Token (-3.2%)", "Another Token (-2.1%)"],
        solanaEcosystem: "The Solana ecosystem is outperforming the broader market with increased DeFi activity."
      };
      
      const formattedTrends = `
## Current Market Trends

${trends.overall}

**Top gainers:**
${trends.topGainers.join(', ')}

**Top losers:**
${trends.topLosers.join(', ')}

**Solana ecosystem:**
${trends.solanaEcosystem}

${context.walletConnected ? 
  `Based on your wallet holdings, you might be interested in keeping an eye on SOL price movements.` : 
  `Connect your wallet for personalized market insights based on your holdings.`}
`;
      
      return {
        message: formattedTrends,
        intent: {
          action: "marketTrends"
        }
      };
    }
  },
  "help": {
    description: "Get help on using the assistant",
    patterns: [
      /(?:help|assist|guide|tutorial|how\s+to\s+use)/i,
      /what\s+can\s+you\s+do/i,
      /(?:list|show)\s+(?:commands|features|abilities)/i,
      /help\s+me/i,
    ],
    handler: (_: RegExpMatchArray, context: any) => {
      const connectionStatus = context.walletConnected 
        ? `Your wallet (${context.walletAddress?.slice(0, 4)}...${context.walletAddress?.slice(-4)}) is connected with ${context.balance.toFixed(4)} SOL.` 
        : "Please connect your wallet to access all features.";
      
      return {
        message: `I'm your advanced Web3 AI assistant. ${connectionStatus}\n\nHere's what I can help you with:\n\n1. **Token Swaps** - Example: "Swap 1 SOL to USDC"\n2. **Balance Check** - Example: "Check my balance"\n3. **Transaction History** - Example: "Show my recent transactions"\n4. **Token Information** - Example: "Tell me about SOL"\n5. **Market Trends** - Example: "What are the market trends?"\n6. **Help** - Example: "What can you do?"\n\nI support many tokens including SOL, USDC, BONK, USDT, JUP, JTO, RAY, PYTH, MEME, and WIF. I can also provide real-time price estimates when performing swaps.`,
        intent: {
          action: "help"
        }
      };
    }
  },
};

// Enhanced conversation context with more detailed user preferences
let conversationContext = {
  recentTopics: [] as string[],
  recentTokens: [] as string[],
  userPreferences: {
    favoriteTokens: [] as string[],
    swapHistory: [] as {from: string, to: string, amount: string}[],
    preferredActions: [] as string[],
    interactionStyle: "neutral", // Can be "technical", "casual", "neutral"
  },
  sessionStartTime: Date.now(),
  suggestedNextActions: [] as string[],
};

// Learning function to update context based on interactions
function updateConversationContext(userInput: string, matchedOperation: string | null, tokensMentioned: string[]) {
  // Track conversation topics
  if (matchedOperation) {
    conversationContext.recentTopics.unshift(matchedOperation);
    // Keep only recent topics
    if (conversationContext.recentTopics.length > 8) {
      conversationContext.recentTopics.pop();
    }
    
    // Track preferred actions
    if (!conversationContext.userPreferences.preferredActions.includes(matchedOperation)) {
      conversationContext.userPreferences.preferredActions.unshift(matchedOperation);
      if (conversationContext.userPreferences.preferredActions.length > 3) {
        conversationContext.userPreferences.preferredActions.pop();
      }
    }
  }
  
  // Track token preferences
  for (const token of tokensMentioned) {
    // Update recent tokens
    conversationContext.recentTokens.unshift(token);
    if (conversationContext.recentTokens.length > 10) {
      conversationContext.recentTokens.pop();
    }
    
    // Update favorite tokens
    if (!conversationContext.userPreferences.favoriteTokens.includes(token)) {
      conversationContext.userPreferences.favoriteTokens.unshift(token);
      if (conversationContext.userPreferences.favoriteTokens.length > 5) {
        conversationContext.userPreferences.favoriteTokens.pop();
      }
    }
  }
  
  // Detect user interaction style
  const technicalTerms = ["tvl", "liquidity", "amm", "slippage", "liquidity pool", "apy", "yield"];
  const casualTerms = ["moon", "dump", "pump", "wen", "lambo", "fomo", "yolo"];
  
  const lowerInput = userInput.toLowerCase();
  
  let hasTechnical = technicalTerms.some(term => lowerInput.includes(term));
  let hasCasual = casualTerms.some(term => lowerInput.includes(term));
  
  if (hasTechnical && !hasCasual) {
    conversationContext.userPreferences.interactionStyle = "technical";
  } else if (hasCasual && !hasTechnical) {
    conversationContext.userPreferences.interactionStyle = "casual";
  }
  
  // Generate suggested next actions based on context
  generateSuggestions();
}

// Generate contextual suggestions based on user history
function generateSuggestions() {
  const suggestions: string[] = [];
  
  // If user has checked balance recently
  if (conversationContext.recentTopics[0] === "balance") {
    suggestions.push("Swap 1 SOL to USDC");
    suggestions.push("Show my transaction history");
  }
  
  // If user has looked up token info
  if (conversationContext.recentTopics[0] === "tokenInfo" && conversationContext.recentTokens[0]) {
    const token = conversationContext.recentTokens[0];
    if (token !== "SOL") {
      suggestions.push(`Swap 10 ${token} to SOL`);
    } else {
      suggestions.push(`Swap 1 SOL to ${conversationContext.userPreferences.favoriteTokens[0] || "USDC"}`);
    }
    suggestions.push("What are the market trends?");
  }
  
  // If user has checked market trends
  if (conversationContext.recentTopics[0] === "marketTrends") {
    suggestions.push(`Tell me about ${conversationContext.recentTokens[0] || "JUP"}`);
    suggestions.push("Check my balance");
  }
  
  // If user has viewed transaction history
  if (conversationContext.recentTopics[0] === "history") {
    suggestions.push("Check my balance");
    suggestions.push("What are the market trends?");
  }
  
  // If user has done a swap
  if (conversationContext.recentTopics[0] === "swap") {
    suggestions.push("Check my balance");
    suggestions.push("Show my transaction history");
  }
  
  // Always add help suggestion if no other suggestions
  if (suggestions.length === 0) {
    suggestions.push("What tokens do you support?");
    suggestions.push("Check my balance");
    suggestions.push("What are the market trends?");
  }
  
  // Limit to 3 suggestions
  conversationContext.suggestedNextActions = suggestions.slice(0, 3);
}

// Function to get personalized tips based on context
function getPersonalizedTips(context: any): string | null {
  // If user has checked balance but hasn't tried swapping
  if (
    conversationContext.recentTopics.includes("balance") && 
    !conversationContext.recentTopics.includes("swap") && 
    Math.random() > 0.6
  ) {
    return "Tip: You can swap your SOL for other tokens by typing 'Swap 1 SOL to USDC'.";
  }
  
  // If user has done swaps but never checked token info
  if (
    conversationContext.recentTopics.includes("swap") && 
    !conversationContext.recentTopics.includes("tokenInfo") && 
    Math.random() > 0.6
  ) {
    const favoriteToken = conversationContext.userPreferences.favoriteTokens[0] || conversationContext.recentTokens[0];
    if (favoriteToken) {
      return `Tip: You can learn more about ${favoriteToken} by asking "Tell me about ${favoriteToken}".`;
    }
  }
  
  // If wallet is connected but has low balance
  if (context.walletConnected && context.balance < 0.05) {
    return "Tip: Your SOL balance is low. You'll need SOL to pay for transaction fees when swapping tokens.";
  }
  
  // If user hasn't checked market trends
  if (
    !conversationContext.recentTopics.includes("marketTrends") && 
    conversationContext.recentTokens.length > 0 &&
    Math.random() > 0.7
  ) {
    return "Tip: Ask 'What are the market trends?' to get insights on current token performance.";
  }
  
  // If user hasn't checked transaction history
  if (
    context.walletConnected &&
    conversationContext.recentTopics.length > 2 &&
    !conversationContext.recentTopics.includes("history") &&
    Math.random() > 0.7
  ) {
    return "Tip: You can view your recent transactions by asking 'Show my transaction history'.";
  }
  
  return null;
}

// General chat handler for non-operation inputs
function handleGeneralChat(prompt: string): { message: string } {
  // Check for conversation patterns
  for (const [type, patterns] of Object.entries(CONVERSATION_PATTERNS)) {
    for (const pattern of patterns) {
      if (prompt.match(pattern)) {
        if (type === 'greeting') {
          const responses = GENERAL_KNOWLEDGE['greetings'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'farewell') {
          return { message: "Goodbye! Feel free to return whenever you have Web3 questions or want to make transactions." };
        } else if (type === 'thanks') {
          const responses = GENERAL_KNOWLEDGE['thanks'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'identity') {
          const responses = GENERAL_KNOWLEDGE['identity'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'capabilities') {
          const responses = GENERAL_KNOWLEDGE['capabilities'];
          return { message: responses[Math.floor(Math.random() * responses.length)] };
        } else if (type === 'joke') {
          return { message: CRYPTO_JOKES[Math.floor(Math.random() * CRYPTO_JOKES.length)] };
        }
      }
    }
  }
  
  // Handle general conversations with a blend of personality and Web3 focus
  return { 
    message: "I'm here to help with Web3 and blockchain topics primarily! You can ask me to swap tokens, check prices, or learn about crypto concepts. I can also chat about other topics, but my expertise is in the blockchain space."
  };
}

// Main function to parse user intent with enhanced capabilities
export async function parseUserIntent(
  prompt: string,
  context: {
    walletConnected: boolean;
    walletAddress: string | null;
    balance: number;
  } = { walletConnected: false, walletAddress: null, balance: 0 }
): Promise<{
  message: string;
  intent?: any;
  suggestions?: string[];
}> {
  try {
    console.log("Enhanced AI processing with context:", {
      walletConnected: context.walletConnected,
      walletAddress: context.walletAddress ? `${context.walletAddress.slice(0, 4)}...${context.walletAddress.slice(-4)}` : null,
      balance: context.balance,
    });

    // Extract mentioned tokens for context
    const mentionedTokens: string[] = [];
    for (const token of Object.keys(TOKEN_INFO)) {
      if (prompt.toUpperCase().includes(token)) {
        mentionedTokens.push(token);
      }
    }
    
    // Try to match against known operations
    for (const [opName, operation] of Object.entries(OPERATIONS)) {
      for (const pattern of operation.patterns) {
        const match = prompt.match(pattern);
        if (match) {
          // Update conversation context for learning
          updateConversationContext(prompt, opName, mentionedTokens);
          
          // Process the match with the operation handler
          const result = await operation.handler(match, context);
          
          // Add personalized tip if available
          const tip = getPersonalizedTips(context);
          if (tip) {
            result.message = `${result.message}\n\n${tip}`;
          }
          
          // Add suggestions for next actions
          return {
            ...result,
            suggestions: conversationContext.suggestedNextActions
          };
        }
      }
    }
    
    // If no operation was matched, treat as general conversation
    return handleGeneralChat(prompt);
    
  } catch (error) {
    console.error("Error processing intent:", error);
    return {
      message: "Sorry, I encountered an error understanding your request. Please try again with a simpler query.",
      intent: null,
      suggestions: ["Check my balance", "Help"]
    };
  }
}

// Export conversation context for external use
export function getConversationContext() {
  return {...conversationContext};
}
