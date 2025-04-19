"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { WalletDataProvider } from "@/lib/wallet-data-provider";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown, Copy, Check, ExternalLink } from "lucide-react";

// Dynamically import wallet components with SSR disabled
const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function WalletConnect() {
  const { publicKey, connected } = useWallet();
  const [walletData, setWalletData] = useState<any>({
    solBalance: 0,
    tokens: [],
    totalValueUsd: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch wallet data
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchWalletData = async () => {
      if (!publicKey || !connected) {
        if (isMounted) {
          setWalletData({
            solBalance: 0,
            tokens: [],
            totalValueUsd: 0
          });
        }
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Use WalletDataProvider for reliable data fetching
        const data = await WalletDataProvider.getWalletData(publicKey.toString());
        
        if (isMounted) {
          setWalletData(data);
          setLoading(false);
          retryCount = 0;
        }
      } catch (error: any) {
        console.error("Failed to fetch wallet data:", error);
        
        if (isMounted) {
          setError("Failed to load wallet data");
          setLoading(false);
          
          // Retry with exponential backoff
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            console.log(`Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
            setTimeout(fetchWalletData, delay);
          }
        }
      }
    };
    
    fetchWalletData();
    
    // Refresh periodically
    const intervalId = setInterval(fetchWalletData, 60000); // Every minute
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [publicKey, connected]);

  // Copy wallet address
  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    if (!publicKey || !connected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await WalletDataProvider.getWalletData(publicKey.toString());
      setWalletData(data);
    } catch (error) {
      console.error("Manual refresh failed:", error);
      setError("Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  // Get explorer URL
  const getExplorerUrl = () => {
    if (!publicKey) return "";
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? 'devnet' : 'mainnet-beta';
    return `https://explorer.solana.com/address/${publicKey.toString()}?cluster=${network}`;
  };

  // Don't render until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {connected && publicKey ? (
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors"
            onClick={() => setShowTokens(!showTokens)}
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`} />
            )}
            <span className="font-medium">
              {walletData.solBalance.toFixed(4)} SOL
              {walletData.totalValueUsd > 0 && ` (≈$${walletData.totalValueUsd.toFixed(2)})`}
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showTokens ? 'rotate-180' : ''}`} />
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={copyAddress}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full hover:bg-secondary transition-colors"
              title="Copy wallet address"
            >
              <span>{`${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`}</span>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
            
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-full hover:bg-secondary transition-colors"
              title="View on Solana Explorer"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh wallet data"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Token dropdown */}
          {showTokens && (
            <div className="absolute top-12 right-4 z-50 bg-card border rounded-md shadow-lg p-2 min-w-48 max-h-64 overflow-y-auto">
              <p className="text-xs font-medium mb-2">Tokens ({walletData.tokens.length})</p>
              {walletData.tokens.map((token: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-1 text-sm">
                  <span className="font-medium">{token.symbol}</span>
                  <div className="text-right">
                    <div>{token.balance.toLocaleString(undefined, {
                      maximumFractionDigits: 6
                    })}</div>
                    {token.usdValue && (
                      <div className="text-xs text-muted-foreground">
                        ${token.usdValue.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
      
      <WalletMultiButtonDynamic className="!bg-primary !rounded-full !text-primary-foreground !py-2 !px-4" />
    </div>
  );
}
