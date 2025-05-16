'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define a RiftInstance type to avoid direct 'any' usage
type RiftInstance = any;

interface RiftContextType {
  riftInstance: RiftInstance;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  txResult: string | null;
  scriptResult: string | null;
  runScript: (cadence: string, args: unknown[]) => Promise<unknown>;
  submitTransaction: (cadence: string, args: unknown[]) => Promise<string>;
  setTxResult: (result: string | null) => void;
  setScriptResult: (result: string | null) => void;
  setError: (error: string | null) => void;
}

const RiftContext = createContext<RiftContextType | null>(null);

export const useRift = () => {
  const context = useContext(RiftContext);
  if (!context) {
    throw new Error('useRift must be used within a RiftProvider');
  }
  return context;
};

export function RiftProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [riftInstance, setRiftInstance] = useState<RiftInstance | null>(null);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;
    
    const initRift = async () => {
      try {
        // Dynamically import rift-js to prevent SSR issues
        const { rift } = await import('rift-js');
        
        // Initialize rift and get the instance
        const instance = await rift();
        setRiftInstance(instance);
        
        // Get user address
        const address = await instance.getUserAddress();
        setAddress(address);
        
        // Set up event listeners
        instance.on('tx:success', (txId: string) => {
          setTxResult(`Transaction successful! ID: ${txId}`);
        });
        
        instance.on('error', (err: Error) => {
          setError(`Error: ${err.message}`);
        });
        
        setIsLoading(false);
      } catch (err) {
        setError(`Failed to initialize Rift: ${(err as Error).message}`);
        setIsLoading(false);
      }
    };

    initRift();
  }, []);

  const runScript = async (cadence: string, args: unknown[] = []) => {
    if (!riftInstance) return null;
    
    setScriptResult(null);
    setError(null);
    
    try {
      const result = await riftInstance.query({
        cadence,
        args
      });
      
      setScriptResult(JSON.stringify(result));
      return result;
    } catch (err) {
      setError(`Script execution failed: ${(err as Error).message}`);
      return null;
    }
  };

  const submitTransaction = async (cadence: string, args: unknown[] = []) => {
    if (!riftInstance) return '';
    
    setTxResult(null);
    setError(null);
    
    try {
      const txId = await riftInstance.mutate({
        cadence,
        args
      });
      
      setTxResult(`Transaction submitted! ID: ${txId}`);
      return txId;
    } catch (err) {
      setError(`Transaction failed: ${(err as Error).message}`);
      return '';
    }
  };

  const value = {
    riftInstance,
    address,
    isLoading,
    error,
    txResult,
    scriptResult,
    runScript,
    submitTransaction,
    setTxResult,
    setScriptResult,
    setError
  };

  return <RiftContext.Provider value={value}>{children}</RiftContext.Provider>;
} 