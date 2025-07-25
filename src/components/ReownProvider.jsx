import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from '@reown/appkit/networks';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Define Monad testnet chain
const monadTestnet = defineChain({
  id: 10143,
  caipNetworkId: 'eip155:10143',
  chainNamespace: 'eip155',
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
});

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks: [monadTestnet],
});

const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [monadTestnet],
  projectId,
  metadata: {
    name: 'Collaborative Lobby',
    description: 'Lobby dApp with Monad testnet',
    url: window.location.origin,
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
});

const queryClient = new QueryClient();

export default function ReownProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
