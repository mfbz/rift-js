'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
    <div className="rift-frame">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-blue-600 hover:underline mr-4">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">NFT Minter</h1>
      </div>
      
      <div className="rift-container">
        <div className="nft-placeholder w-full max-w-md mx-auto">
          {isMinted ? (
            <Image 
              src="https://via.placeholder.com/500x500" 
              alt="Minted NFT"
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">NFT will appear here after minting</div>
          )}
        </div>
        
        <div className="w-full max-w-md mx-auto mt-4">
          <button 
            onClick={handleMint}
            disabled={isLoading || isMinted}
            className={`rift-button w-full ${isMinted ? 'bg-green-600 hover:bg-green-700' : ''} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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