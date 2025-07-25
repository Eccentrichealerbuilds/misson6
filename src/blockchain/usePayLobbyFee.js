import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useEffect, useState, useCallback } from 'react';

// Hook to charge a 0.001 MON fee (on Monad testnet) before creating / joining a lobby.
// Stores a localStorage flag so the user is not asked twice per wallet address per day.
export default function usePayLobbyFee() {
  const { address, isConnected } = useAccount();
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const recipient = import.meta.env.VITE_LOBBY_FEE_RECIPIENT;

  // Local-storage key, reset daily (timestamp truncated to YYYY-MM-DD).
  const todayKey = address ? `paid-fee-${address}-${new Date().toISOString().slice(0, 10)}` : null;

  useEffect(() => {
    if (todayKey && localStorage.getItem(todayKey) === 'true') {
      setAlreadyPaid(true);
    }
  }, [todayKey]);

    const {
    sendTransactionAsync,
    data,
    isLoading: isSending,
    error: sendError,
  } = useSendTransaction();

  // Immediately mark paid after sending to keep UX simple.
  useEffect(() => {
    if (txHash && todayKey) {
      localStorage.setItem(todayKey, 'true');
      setAlreadyPaid(true);
    }
  }, [txHash, todayKey]);

  const pay = useCallback(async () => {
    if (alreadyPaid) return true;
    if (!isConnected) throw new Error('Wallet not connected');
    if (!recipient) throw new Error('Recipient not configured');
    try {
      const hash = await sendTransactionAsync({ to: recipient, value: parseEther('0.001') });
      setTxHash(hash);
      return true;
    } catch (err) {
      console.error('sendTransaction failed', err);
      throw err;
    }
  }, [alreadyPaid, isConnected, recipient]);

  return {
    pay,
    alreadyPaid,
    isPaying: isSending,
    txHash,
    error: sendError,
  };
}
