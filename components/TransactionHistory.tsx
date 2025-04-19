"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useWalletStore } from "@/lib/wallet-store";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, RefreshCw } from "lucide-react";

// Type definition for transaction display
interface Transaction {
  signature: string;
  timestamp: number;
  type: string;
  fromToken: string;
  toToken?: string;
  amount: string;
  fee: string;
  status: string;
}

export function TransactionHistory() {
  const { connected, publicKey } = useWallet();
  const { walletData, refreshWalletData } = useWalletStore();
  const [loading, setLoading] = useState(false);

  // Refresh transactions
  const handleRefresh = async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    try {
      await refreshWalletData();
    } catch (error) {
      console.error("Error refreshing transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get explorer URL for a transaction or address
  const getExplorerUrl = (signature?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' 
      ? 'https://explorer.solana.com' 
      : 'https://explorer.solana.com';
    
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' 
      ? '?cluster=devnet' 
      : '';
    
    if (signature) {
      return `${baseUrl}/tx/${signature}${network}`;
    } else if (publicKey) {
      return `${baseUrl}/address/${publicKey.toString()}${network}`;
    }
    
    return baseUrl;
  };

  // Format timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get transaction type display
  const getTransactionTypeDisplay = (type: string) => {
    switch (type.toLowerCase()) {
      case 'swap':
        return 'Token Swap';
      case 'transfer':
        return 'Transfer';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Card className="w-full border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {connected 
              ? `Recent transactions for ${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}` 
              : 'Connect your wallet to view transactions'}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={loading || !connected}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      
      <CardContent>
        {!connected ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              Connect your wallet to view your transaction history
            </p>
          </div>
        ) : walletData.recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              No transactions found for this wallet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {walletData.recentTransactions.map((tx: Transaction) => (
              <div 
                key={tx.signature} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-accent/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      {getTransactionTypeDisplay(tx.type)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </span>
                  </div>
                  
                  <p className="mt-2 truncate">
                    {tx.type === 'swap' 
                      ? `Swapped ${tx.amount} ${tx.fromToken} to ${tx.toToken || '?'}`
                      : `${tx.amount} ${tx.fromToken}`}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Fee: {tx.fee} SOL
                    </span>
                    <span className={`text-xs ${tx.status === 'confirmed' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.status === 'confirmed' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 sm:mt-0">
                  <a
                    href={getExplorerUrl(tx.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    View
                    <ExternalLinkIcon className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
