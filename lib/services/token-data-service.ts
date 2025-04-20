/**
 * Token Data Service
 * Fetches data for token contracts from multiple sources
 */

// Utilities for chain detection
const isSolanaAddress = (address: string): boolean => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

const isEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// DexScreener API functions
const fetchDexScreenerData = async (address: string, chain: string = 'ethereum') => {
  try {
    let endpoint = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    
    if (chain === 'solana') {
      endpoint += '?baseChain=solana';
    } else if (chain === 'bsc') {
      endpoint += '?baseChain=bsc';
    }
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`DexScreener API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching from DexScreener:", error);
    return null;
  }
};

// CoinGecko API functions
const fetchCoinGeckoData = async (address: string, chain: string = 'ethereum') => {
  try {
    let platformId;
    switch (chain) {
      case 'ethereum': platformId = 'ethereum'; break;
      case 'bsc': platformId = 'binance-smart-chain'; break;
      case 'solana': platformId = 'solana'; break;
      default: platformId = 'ethereum';
    }
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${platformId}/contract/${address}`
    );
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);
    return null;
  }
};

// Generate market commentary based on token performance metrics
const generateMarketCommentary = (priceChange: number, volume: number, liquidity: number): string => {
  const comments = [];
  
  // Price commentary
  if (priceChange > 15) {
    comments.push("🚀 This token is on an absolute tear right now! Extremely bullish price action, but be cautious of potential pullbacks after such rapid gains.");
  } else if (priceChange > 5) {
    comments.push("📈 Showing strong bullish momentum. The positive price action suggests growing interest, but always consider market cycles.");
  } else if (priceChange > 0) {
    comments.push("👍 Modest positive momentum. The token is performing relatively well in current market conditions.");
  } else if (priceChange > -5) {
    comments.push("😐 Price is relatively stable. Could be consolidating before the next move, or facing resistance at current levels.");
  } else if (priceChange > -15) {
    comments.push("📉 Currently in a downtrend. May be looking for support, or facing selling pressure.");
  } else {
    comments.push("🔻 Experiencing significant selling pressure. Could indicate broader concerns or just temporary market dynamics.");
  }
  
  // Volume commentary
  if (volume > 1000000) {
    comments.push("Trading volume is substantial, indicating strong interest and liquidity, which is positive for traders.");
  } else if (volume > 100000) {
    comments.push("Decent trading volume shows reasonable market participation. Not the highest, but sufficient for most trades.");
  } else {
    comments.push("Volume is on the lower side, which could result in higher slippage when trading and indicates limited current interest.");
  }
  
  // Liquidity commentary
  if (liquidity > 500000) {
    comments.push("Liquidity looks healthy, which reduces potential slippage and generally makes for a more stable trading environment.");
  } else if (liquidity > 50000) {
    comments.push("Has reasonable liquidity for its size, but larger trades might still experience some slippage.");
  } else {
    comments.push("Low liquidity means potentially high slippage and volatility. Exercise caution with larger positions.");
  }
  
  return comments.join(" ");
};

// Format token data into a readable response
const formatTokenData = (dexData: any, chain: string, geckoData: any = null): string => {
  if (!dexData || !dexData.pairs || dexData.pairs.length === 0) {
    const funnyResponses = [
      "This token is so underground even my AI circuits can't detect it. Either it's ultra-degen or doesn't exist! 🕵️",
      "Hmm, this token is playing hide and seek with my algorithms. Too degen or just imaginary? You decide! 🤔",
      "My digital neurons are buzzing but this token is nowhere to be found. It might be too new, too obscure, or from the crypto twilight zone! 👻",
      "I've searched the deepest corners of the blockchain and came up empty-handed. This might be the rarest token ever or... not real? 🧐"
    ];
    return funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
  }
  
  // Sort pairs by liquidity and use the highest liquidity pair
  const pairs = [...dexData.pairs].sort((a, b) => 
    parseFloat(b.liquidity?.usd || '0') - parseFloat(a.liquidity?.usd || '0')
  );
  
  const mainPair = pairs[0];
  const tokenName = mainPair.baseToken.name;
  const tokenSymbol = mainPair.baseToken.symbol;
  const price = parseFloat(mainPair.priceUsd);
  const priceChange = parseFloat(mainPair.priceChange?.h24 || '0');
  const volume24h = parseFloat(mainPair.volume?.h24 || '0');
  const liquidity = parseFloat(mainPair.liquidity?.usd || '0');
  const pairAddress = mainPair.pairAddress;
  const dexId = mainPair.dexId;
  
  let chainName = "Unknown Chain";
  if (chain === "ethereum") chainName = "Ethereum";
  else if (chain === "bsc") chainName = "Binance Smart Chain";
  else if (chain === "solana") chainName = "Solana";
  
  // Generate commentary
  const commentary = generateMarketCommentary(priceChange, volume24h, liquidity);
  
  // Additional info from CoinGecko if available
  let additionalInfo = "";
  if (geckoData && geckoData.market_data) {
    try {
      additionalInfo = `
**Additional Info:**
- Market Cap: $${geckoData.market_data.market_cap?.usd ? (geckoData.market_data.market_cap.usd / 1000000).toFixed(2) + 'M' : 'N/A'}
- Market Cap Rank: ${geckoData.market_cap_rank || 'N/A'}
- All Time High: $${geckoData.market_data.ath?.usd ? geckoData.market_data.ath.usd.toFixed(6) : 'N/A'}
${geckoData.description?.en ? '- Description: ' + geckoData.description.en.slice(0, 150) + '...' : ''}
`;
    } catch (e) {
      // Silently fail if structure is unexpected
    }
  }
  
  // Format markdown response
  return `
## ${tokenName} (${tokenSymbol})

**Chain:** ${chainName}
**Contract:** \`${mainPair.baseToken.address}\`

**Current Stats:**
- 💰 Price: $${price < 0.01 ? price.toFixed(8) : price < 1 ? price.toFixed(4) : price.toFixed(2)}
- ${priceChange >= 0 ? '📈' : '📉'} 24h Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
- 📊 24h Volume: $${(volume24h / 1000000).toFixed(2)}M
- 💧 Liquidity: $${(liquidity / 1000000).toFixed(2)}M

**Trading Info:**
- DEX: ${dexId}
- Pair Address: \`${pairAddress}\`
${additionalInfo}
**Market Analysis:**
${commentary}

[View on DexScreener](https://dexscreener.com/${mainPair.chainId}/${pairAddress})
${geckoData ? `[View on CoinGecko](https://www.coingecko.com/en/coins/${geckoData.id})` : ''}
`;
};

// Main exported function to fetch token data
export const fetchTokenData = async (address: string, chain: string = 'ethereum'): Promise<string> => {
  try {
    // Step 1: Fetch from DexScreener
    const dexData = await fetchDexScreenerData(address, chain);
    
    // Step 2: Try to fetch from CoinGecko
    let geckoData = null;
    try {
      geckoData = await fetchCoinGeckoData(address, chain);
    } catch (e) {
      // Silently fail if CoinGecko fails
    }
    
    // Step 3: Format the data into a response
    return formatTokenData(dexData, chain, geckoData);
  } catch (error) {
    console.error("Error in fetchTokenData:", error);
    return "Sorry, I couldn't fetch information for this token contract. The API might be rate-limited or the contract might not be valid.";
  }
};
