"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletStore } from "@/lib/wallet-store";

export function TransactionHistory() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Filter out error transactions silently
  const handleErrorSilently = (error: any) => {
    console.error("Transaction error (hidden from user):", error);
    // Log to analytics or monitoring service here if needed
  };

  const fetchTransactions = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      // Get recent transaction signatures
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
      
      // Get transaction details
      const transactionDetails = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            
            // If transaction failed or has errors, silently skip it
            if (!tx || tx.meta?.err) {
              return null;
            }
            
            // Extract relevant information for successful transactions only
            return {
              signature: sig.signature,
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : new Date(),
              type: determineTransactionType(tx),
              amount: extractAmount(tx),
              status: "confirmed",
              recipient: extractRecipient(tx),
            };
          } catch (error) {
            handleErrorSilently(error);
            return null;
          }
        })
      );
      
      // Filter out null values (failed transactions) and update state
      const validTransactions = transactionDetails.filter(tx => tx !== null);
      setTransactions(validTransactions);
    } catch (error) {
      handleErrorSilently(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to extract transaction data
  const determineTransactionType = (tx: any) => {
    // This is a simplified version - expand based on your specific transaction types
    if (tx.meta?.logMessages?.some((msg: string) => msg.includes("Swap"))) {
      return "swap";
    } else if (tx.meta?.logMessages?.some((msg: string) => msg.includes("Transfer"))) {
      return "transfer";
    }
    return "transaction";
  };

  const extractAmount = (tx: any) => {
    // Simplified - expand based on your specific transaction format
    try {
      const preBalances = tx.meta?.preBalances || [0];
      const postBalances = tx.meta?.postBalances || [0];
      const change = Math.abs(postBalances[0] - preBalances[0]) / 1000000000;
      return change.toFixed(4);
    } catch {
      return "0";
    }
  };

  const extractRecipient = (tx: any) => {
    // Simplified - expand based on your specific transaction format
    try {
      const accounts = tx.transaction.message.accountKeys;
      if (accounts.length > 1) {
        return accounts[1].pubkey.toString().substring(0, 6) + "..." + 
               accounts[1].pubkey.toString().substring(accounts[1].pubkey.toString().length - 4);
      }
      return "Unknown";
    } catch {
      return "Unknown";
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    if (publicKey) {
      fetchTransactions();
      
      // Poll for updates every 15 seconds
      const interval = setInterval(fetchTransactions, 15000);
      setPollingInterval(interval);
      
      return () => {
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }
  }, [publicKey, connection]);

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "swap":
        return (
          <div className="text-blue-400 bg-blue-400/10 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4M7 4L3 8M7 4L11 8" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        );
      case "transfer":
        return (
          <div className="text-green-400 bg-green-400/10 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="text-primary bg-primary/10 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
        );
    }
  };

  // Formatted time for transaction
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Formatted date for transaction
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
      <h3 className="text-base font-medium mb-3 flex items-center">
        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
        Transaction History
        {loading && (
          <span className="ml-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </motion.div>
          </span>
        )}
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {transactions.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.signature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center p-2 rounded-lg hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
                >
                  {getTransactionIcon(tx.type)}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="font-medium text-sm truncate capitalize">{tx.type}</p>
                      <span className="text-xs text-muted-foreground">{formatTime(tx.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-muted-foreground">To: {tx.recipient}</p>
                      <span className="text-xs font-medium">{tx.amount} SOL</span>
                    </div>
                    <div className="w-full mt-1 h-1 bg-primary/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/20 rounded-full w-full"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border/30">
        <button className="w-full text-xs text-primary hover:text-primary/70 transition-colors py-1 rounded-md flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Refresh transactions
        </button>
      </div>
    </div>
  );
}
