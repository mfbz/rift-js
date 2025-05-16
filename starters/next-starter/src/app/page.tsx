'use client';

import Link from 'next/link';
import { useRift } from '@/components/rift-provider';

export default function Home() {
  const { 
    address, 
    isLoading, 
    error, 
    scriptResult, 
    txResult, 
    runScript, 
    submitTransaction 
  } = useRift();

  const handleRunScript = async () => {
    await runScript(`
      access(all) fun main(): String {
        return "Hello from Rift!"
      }
    `, []);
  };

  const handleSubmitTransaction = async () => {
    await submitTransaction(`
      transaction {
        execute {
          log("Hello from transaction!")
        }
      }
    `, []);
  };

  return (
    <div className="rift-frame">
      <h1 className="text-2xl font-bold mb-6">Rift Next.js Starter</h1>
      
      {isLoading ? (
        <p>Connecting to wallet...</p>
      ) : error && !address ? (
        <div className="rift-error">{error}</div>
      ) : (
        <div className="rift-container">
          <div>
            <h2 className="text-lg font-semibold mb-2">Connected Address</h2>
            {address ? (
              <div className="rift-address">{address}</div>
            ) : (
              <p>Not connected</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Actions</h2>
            <div className="flex flex-wrap">
              <button 
                onClick={handleRunScript} 
                className="rift-button"
              >
                Run Script
              </button>
              <button 
                onClick={handleSubmitTransaction}
                className="rift-button"
              >
                Submit Transaction
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Examples</h2>
            <div className="flex flex-col space-y-2">
              <Link 
                href="/nft-minter" 
                className="text-blue-600 hover:underline"
              >
                NFT Minter Example
              </Link>
              <Link 
                href="/nft-carousel" 
                className="text-blue-600 hover:underline"
              >
                NFT Carousel Example
              </Link>
              <Link 
                href="/token-buy" 
                className="text-blue-600 hover:underline"
              >
                Token Buy Example
              </Link>
            </div>
          </div>

          {scriptResult && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Script Result</h2>
              <div className="rift-result">{scriptResult}</div>
            </div>
          )}

          {txResult && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Transaction Status</h2>
              <div className="rift-result">{txResult}</div>
            </div>
          )}

          {error && (
            <div className="rift-error">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
