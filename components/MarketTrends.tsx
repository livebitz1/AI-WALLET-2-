"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Define types for CoinMarketCap API response
interface CoinData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      volume_24h: number;
    }
  };
}

interface MarketData {
  data: CoinData[];
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

export function MarketTrends() {
  const [marketData, setMarketData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        // Call our API endpoint that handles the CoinMarketCap API call
        const response = await axios.get<MarketData>('/api/market-trends');
        
        if (response.data && response.data.data) {
          // Sort by market cap and get top 5
          const sortedCoins = response.data.data
            .sort((a, b) => b.quote.USD.market_cap - a.quote.USD.market_cap)
            .slice(0, 5);
          
          setMarketData(sortedCoins);
          setLastUpdated(new Date().toLocaleTimeString());
          setError(null);
        } else {
          throw new Error('Invalid data structure received');
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Refresh data every 2 minutes (CoinMarketCap recommends avoiding too frequent requests)
    const intervalId = setInterval(fetchMarketData, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-lg transition-all hover:shadow-xl hover:border-primary/20 overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-border/40 flex justify-between items-center">
        <h3 className="text-base font-medium">Market Trends</h3>
        {!loading && !error && (
          <span className="text-xs text-muted-foreground">
            Updated: {lastUpdated}
          </span>
        )}
      </div>

      <div className="divide-y divide-border/40">
        {loading ? (
          // Loading skeleton
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-3 flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-muted"></div>
                <div>
                  <div className="h-4 w-16 bg-muted rounded"></div>
                  <div className="h-3 w-24 bg-muted rounded mt-1"></div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-3 w-12 bg-muted rounded mt-1"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-xs text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          marketData.map((coin) => (
            <motion.div 
              key={coin.id} 
              className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold">{coin.symbol.substring(0, 1)}</span>
                </div>
                <div>
                  <div className="font-medium">{coin.symbol}</div>
                  <div className="text-xs text-muted-foreground">{coin.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  ${formatPrice(coin.quote.USD.price)}
                </div>
                <div className={`text-xs ${coin.quote.USD.percent_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {coin.quote.USD.percent_change_24h >= 0 ? '+' : ''}
                  {coin.quote.USD.percent_change_24h.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper function to format price based on value
function formatPrice(price: number): string {
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
