import React, { useState } from 'react'
import { useAccount } from 'wagmi' // Provided by WagmiProvider via ReownProvider

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  return (
    <div className="wallet-connect" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <appkit-button />
      {isConnected && address && (
        <span style={{ fontFamily: 'monospace', fontSize: '0.95em' }}>
          🦊 {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      )}
    </div>
  );
}
