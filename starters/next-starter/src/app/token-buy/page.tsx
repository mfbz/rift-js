'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRift } from '@/components/rift-provider';

export default function TokenBuy() {
  const { submitTransaction } = useRift();
  const [amount, setAmount] = useState<string>('10');
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasedAmount, setPurchasedAmount] = useState<string>('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters and leading zeros
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value === '' ? '' : String(parseInt(value) || ''));
  };

  const handleBuy = async () => {
    if (!amount || parseInt(amount) <= 0) return;
    
    setIsLoading(true);
    
    try {
      await submitTransaction(`
        transaction {
          execute {
            log("Hello from token purchase transaction!")
          }
        }
      `, []);
      
      // Simulate waiting for transaction to be processed
      setTimeout(() => {
        setPurchasedAmount(amount);
        setIsPurchased(true);
        setIsLoading(false);
      }, 2000);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="rift-frame">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-blue-600 hover:underline mr-4">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Token Buy</h1>
      </div>
      
      <div className="rift-container">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount of tokens to buy
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                disabled={isLoading || isPurchased}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Enter amount"
              />
            </div>
          </div>
          
          <button
            onClick={handleBuy}
            disabled={isLoading || isPurchased || !amount || parseInt(amount) <= 0}
            className={`rift-button w-full ${isPurchased ? 'bg-green-600 hover:bg-green-700' : ''} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="rift-loading border-white mr-2"></div>
                Processing...
              </div>
            ) : isPurchased ? (
              'Tokens Purchased!'
            ) : (
              `Buy ${amount || '0'} $TOKEN`
            )}
          </button>
          
          {isPurchased && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg">
              You successfully bought {purchasedAmount} $TOKEN!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 