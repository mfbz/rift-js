'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRift } from '@/components/rift-provider';

type NFT = {
  id: number;
  image: string;
  name: string;
  price: string;
  purchased: boolean;
  loading: boolean;
  backgroundColor: string;
}

export default function NFTCarousel() {
  const { submitTransaction } = useRift();
  
  // Mock NFT data
  const [nfts, setNfts] = useState<NFT[]>([
    { id: 1, image: '/kitties/kitty-1.png', name: 'Ahman Lubfuzzle', price: '10', purchased: false, loading: false, backgroundColor: '#F49BAB' },
    { id: 2, image: '/kitties/kitty-2.png', name: 'Chayim Poopsmookie', price: '15', purchased: false, loading: false, backgroundColor: '#FBF3C1' },
    { id: 3, image: '/kitties/kitty-3.png', name: 'Guile Demonbest', price: '12', purchased: false, loading: false, backgroundColor: '#A8F1FF' },
    { id: 4, image: '/kitties/kitty-4.png', name: 'Loki Zippycutie', price: '20', purchased: false, loading: false, backgroundColor: '#DDEB9D' },
  ]);

  const handleBuy = async (id: number) => {
    // Find and update the NFT
    setNfts(prevNfts => 
      prevNfts.map(nft => 
        nft.id === id ? { ...nft, loading: true } : nft
      )
    );
    
    try {
      await submitTransaction(`
        transaction {
          execute {
            log("Hello from NFT purchase transaction!")
          }
        }
      `, []);
      
      // Simulate waiting for transaction to be processed
      setTimeout(() => {
        setNfts(prevNfts => 
          prevNfts.map(nft => 
            nft.id === id ? { ...nft, loading: false, purchased: true } : nft
          )
        );
      }, 2000);
    } catch {
      setNfts(prevNfts => 
        prevNfts.map(nft => 
          nft.id === id ? { ...nft, loading: false } : nft
        )
      );
    }
  };

  return (
    <div className="rift-frame">
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-min">
          {nfts.map(nft => (
            <div key={nft.id} className="nft-card">
              <Image 
                src={nft.image} 
                alt={nft.name}
                width={200}
                height={200}
                className="nft-card-image"
                style={{ backgroundColor: nft.backgroundColor }}
              />
              <div className="p-3 bg-white">
                <h3 className="font-medium text-sm mb-1">{nft.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{nft.price} FLOW</p>
                <button
                  onClick={() => !nft.purchased && !nft.loading && handleBuy(nft.id)}
                  disabled={nft.purchased || nft.loading}
                  className={`w-full py-1.5 px-3 text-sm rounded-4xl transition-colors ${
                    nft.purchased 
                      ? 'bg-green-600 text-white cursor-default' 
                      : nft.loading 
                        ? 'bg-gray-400 text-white cursor-wait' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {nft.loading ? (
                    <div className="flex items-center justify-center">
                      <div className="rift-loading border-white mr-1 h-3 w-3"></div>
                      <span>Buying...</span>
                    </div>
                  ) : nft.purchased ? (
                    'Purchased'
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 