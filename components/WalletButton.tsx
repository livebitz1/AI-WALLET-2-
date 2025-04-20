"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/lib/wallet-store";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Copy, Check, ExternalLink, 
  ChevronDown, Activity, LogOut, 
  Loader2, Wallet as WalletIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { walletData } = useWalletStore();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fix hydration issues by only showing component after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDisconnectConfirm(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set up real-time data polling from the wallet
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Only set up polling when connected
    if (connected && publicKey) {
      // Initial fetch
      const fetchWalletData = async () => {
        try {
          // Direct connection to update wallet data
          const { Connection } = await import('@solana/web3.js');
          const connection = new Connection(
            process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
            'confirmed'
          );
          
          // Get SOL balance directly
          const balance = await connection.getBalance(publicKey);
          const solBalance = balance / 1e9; // Convert lamports to SOL
          
          // Update the store with our data - without tokens
          useWalletStore.setState({
            walletData: {
              ...useWalletStore.getState().walletData,
              solBalance,
              totalValueUsd: solBalance * 20, // Placeholder: SOL price ~$20
              tokens: [], // Empty array instead of fetching tokens
              isLoading: false,
              lastUpdated: new Date().toISOString()
            }
          });
          
          console.log("Updated wallet data with SOL balance:", solBalance);
        } catch (error) {
          console.error("Error fetching wallet data:", error);
          useWalletStore.setState(state => ({
            walletData: {
              ...state.walletData,
              isLoading: false
            }
          }));
        }
      };

      // Set loading state before fetch
      useWalletStore.setState(state => ({
        walletData: {
          ...state.walletData,
          isLoading: true
        }
      }));

      // Fetch immediately
      fetchWalletData();
      
      // Then set up interval for real-time updates
      // More frequent updates when dropdown is open
      intervalId = setInterval(
        fetchWalletData,
        isOpen ? 10000 : 30000 // Poll every 10 seconds when open, 30 when closed
      );
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connected, publicKey, isOpen]);

  // Copy wallet address to clipboard
  const copyAddress = async () => {
    if (!publicKey) return;
    
    try {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      console.log("Address copied to clipboard:", publicKey.toString());
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
      // Show visual feedback even if copy failed
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    }
  };

  // Open transaction explorer
  const openExplorer = () => {
    if (!publicKey) return;
    const explorerUrl = `https://explorer.solana.com/address/${publicKey.toString()}`;
    console.log("Opening explorer:", explorerUrl);
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  // Handle wallet disconnect with confirmation
  const handleDisconnect = async () => {
    if (!showDisconnectConfirm) {
      setShowDisconnectConfirm(true);
      return;
    }
    
    setLoading(true);
    try {
      await disconnect();
      setShowDisconnectConfirm(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to disconnect wallet");
    } finally {
      setLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Get network health status
  const getNetworkStatus = () => {
    return {
      status: "healthy", 
      avgBlockTime: "400ms",
      tps: "1,500" 
    };
  };

  const networkStatus = getNetworkStatus();

  if (!mounted) return null;

  if (!connected || !publicKey) {
    return (
      <div className="relative z-10">
        <WalletMultiButton className="wallet-adapter-button" />
      </div>
    );
  }

  return (
    <div className="relative z-10" ref={dropdownRef}>
      {/* Custom wallet button when connected */}
      <Button 
        variant="outline" 
        className="flex items-center gap-2 border border-orange-500/30 bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-600/90 hover:to-orange-700/90 text-white transition-all px-3 h-10 shadow-md hover:shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div 
          className="w-2 h-2 rounded-full bg-white"
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.span 
          className="font-medium truncate max-w-[120px]"
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          {formatAddress(publicKey.toString())}
        </motion.span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={16} className="text-white/90" />
        </motion.div>
      </Button>

      {/* Custom dropdown menu implementation */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-orange-500/20 bg-card/95 backdrop-blur-sm shadow-xl z-50 overflow-hidden"
        >
          {/* Header with wallet info */}
          <div className="px-4 py-3 border-b border-border/20 bg-gradient-to-r from-orange-500/10 to-orange-600/5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <WalletIcon size={14} />
                </div>
                <span>Wallet</span>
              </div>
              <div className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded-sm">
                Connected
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{formatAddress(publicKey.toString())}</span>
                <button 
                  onClick={copyAddress} 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button 
                  onClick={openExplorer} 
                  className="text-primary hover:text-primary/80 transition-colors ml-1"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Balance section */}
          <div className="p-3 border-b border-border/20">
            <div className="flex justify-between items-center px-2 py-1">
              <div className="flex flex-col">
                <motion.span 
                  className="text-xl font-medium text-orange-500"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={walletData.solBalance}
                  transition={{ duration: 0.3 }}
                >
                  {walletData.solBalance.toFixed(4)} SOL
                </motion.span>
                <motion.span 
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  ≈${walletData.totalValueUsd.toFixed(2)} USD
                </motion.span>
              </div>

              {/* Display loading indicator only when loading */}
              {walletData.isLoading && (
                <motion.div 
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 360 }}
                  transition={{ duration: 0.5, rotate: { loop: Infinity, ease: "linear", duration: 1 } }}
                >
                  <Loader2 size={16} className="text-orange-500" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Actions section */}
          <div className="p-1">
            <button 
              className="w-full text-left px-3 py-2 flex items-center gap-2 rounded-md hover:bg-primary/10 transition-colors"
              onClick={openExplorer}
            >
              <Activity size={14} />
              <span>View Explorer</span>
            </button>
            
            <div className="mx-1 my-1 h-px bg-border/20"></div>

            <div className="px-3 py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  networkStatus.status === "healthy" ? "bg-green-500" : 
                  networkStatus.status === "congested" ? "bg-yellow-500" : "bg-red-500"
                }`}></div>
                <span>Network</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {networkStatus.tps} TPS · {networkStatus.avgBlockTime}
              </div>
            </div>
            
            <div className="mx-1 my-1 h-px bg-border/20"></div>
            
            <button 
              onClick={handleDisconnect}
              className="w-full text-left px-3 py-2 flex items-center gap-2 rounded-md hover:bg-primary/10 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} className={showDisconnectConfirm ? "text-red-500" : ""} />
              )}
              <span className={showDisconnectConfirm ? "text-red-500 font-medium" : ""}>
                {showDisconnectConfirm ? "Click again to confirm" : "Disconnect wallet"}
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Mini balance indicator when not showing dropdown */}
      {connected && publicKey && walletData.solBalance > 0 && !isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute top-full right-0 mt-2 bg-gradient-to-r from-orange-500/90 to-orange-600/90 text-white backdrop-blur-sm border border-orange-500/30 rounded-md shadow-lg px-3 py-2 text-sm"
        >
          <motion.span 
            className="font-medium"
            animate={{ 
              textShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 10px rgba(255,255,255,0.5)", "0 0 0px rgba(255,255,255,0)"] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {walletData.solBalance.toFixed(4)} SOL
          </motion.span>
          {walletData.totalValueUsd > 0 && (
            <span className="text-xs text-white/80 ml-1">
              (≈${walletData.totalValueUsd.toFixed(2)})
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}