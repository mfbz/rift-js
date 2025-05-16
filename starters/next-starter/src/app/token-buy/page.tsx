'use client';

import { useState } from 'react';
import { useRift } from '@/components/rift-provider';
import Image from 'next/image';

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
      <div className="rift-container">
        
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-start">
            <div className="mr-2 flex-shrink-0">
              <div className="rounded-lg overflow-hidden" style={{ marginTop: -12 }}>
                <Image 
                  src="/kitties/coin.png" 
                  alt="Token Icon" 
                  width={158} 
                  height={158}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isLoading || isPurchased}
                    className="block w-full rounded-2xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              
              <button
                onClick={handleBuy}
                disabled={isLoading || isPurchased || !amount || parseInt(amount) <= 0}
                className={`rift-button w-full text-2xl ${isPurchased ? 'bg-blue-600' : 'bg-purple-600'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{ height: 74 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="rift-loading border-white mr-2"></div>
                    Processing...
                  </div>
                ) : isPurchased ? (
                  'Tokens Purchased!'
                ) : (
                  `Buy ${amount || '0'}$MEOW`
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
      </div>
    </div>
  );
} 