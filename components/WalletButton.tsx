"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/lib/wallet-store";

export function WalletButton() {
  const { connected, publicKey } = useWallet();
  const { walletData } = useWalletStore();
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues by only showing component after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative z-10">
      <WalletMultiButton className="wallet-adapter-button" />
      
      {connected && publicKey && walletData.solBalance > 0 && (
        <div className="absolute top-full right-0 mt-2 bg-card border rounded-md shadow-lg px-3 py-2 text-sm">
          <span className="font-medium">{walletData.solBalance.toFixed(4)} SOL</span>
          {walletData.totalValueUsd > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              (≈${walletData.totalValueUsd.toFixed(2)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
