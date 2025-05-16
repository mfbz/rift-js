'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRift } from '@/components/rift-provider';

export default function NFTMinter() {
  const { submitTransaction } = useRift();
  const [isLoading, setIsLoading] = useState(false);
  const [isMinted, setIsMinted] = useState(false);

  const handleMint = async () => {
    setIsLoading(true);
    
    try {
      await submitTransaction(`
        transaction {
          execute {
            log("Hello from NFT mint transaction!")
          }
        }
      `, []);
      
      // Simulate waiting for transaction to be processed
      setTimeout(() => {
        setIsMinted(true);
        setIsLoading(false);
      }, 2000);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="rift-frame bg-purple-700">
      <div className="rift-container">
        <div className="nft-placeholder w-full max-w-md mx-auto">
          {isMinted ? (
            <Image 
              src="/kitties/kitty-1.png" 
              alt="Minted NFT"
              width={300}
              height={300}
              className="w-full h-full object-cover bg-purple-400"
            />
          ) : (
            <Image 
              src="/kitties/egg.png" 
              alt="Minted NFT Placeholder"
              width={300}
              height={300}
              className="w-full h-full object-cover bg-purple-400"
            />
          )}
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <button 
            onClick={handleMint}
            disabled={isLoading || isMinted}
            className={`rift-button w-full cursor-pointer ${isMinted ? 'bg-lime-500' : 'bg-purple-500'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="rift-loading border-white mr-2"></div>
                Minting...
              </div>
            ) : isMinted ? (
              'NFT Minted!'
            ) : (
              'Mint NFT'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 