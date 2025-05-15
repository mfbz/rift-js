import { useState, useEffect } from 'react'
import { rift } from 'rift-js'

function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [scriptResult, setScriptResult] = useState<string | null>(null)
  const [txResult, setTxResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [riftInstance, setRiftInstance] = useState<any>(null)

  useEffect(() => {
    const initRift = async () => {
      try {
        // Initialize rift and get the instance
        const instance = await rift()
        setRiftInstance(instance)
        
        // Get user address
        const address = await instance.getUserAddress()
        setAddress(address)
        
        // Set up event listeners
        instance.on('tx:success', (txId: string) => {
          setTxResult(`Transaction successful! ID: ${txId}`)
        })
        
        instance.on('error', (err: Error) => {
          setError(`Error: ${err.message}`)
        })
        
        setIsLoading(false)
      } catch (err: any) {
        setError(`Failed to initialize Rift: ${err.message}`)
        setIsLoading(false)
      }
    }

    initRift()
  }, [])

  const runScript = async () => {
    if (!riftInstance) return
    
    setScriptResult(null)
    setError(null)
    
    try {
      const result = await riftInstance.query({
        cadence: `
          access(all) fun main(): String {
            return "Hello from Rift!"
          }
        `,
        args: []
      })
      
      setScriptResult(JSON.stringify(result))
    } catch (err: any) {
      setError(`Script execution failed: ${err.message}`)
    }
  }

  const submitTransaction = async () => {
    if (!riftInstance) return
    
    setTxResult(null)
    setError(null)
    
    try {
      const txId = await riftInstance.mutate({
        cadence: `
          transaction {
            execute {
              log("Hello from transaction!")
            }
          }
        `,
        args: []
      })
      
      setTxResult(`Transaction submitted! ID: ${txId}`)
    } catch (err: any) {
      setError(`Transaction failed: ${err.message}`)
    }
  }

  return (
    <div className="rift-frame">
      <h1>Rift React Starter</h1>
      
      {isLoading ? (
        <p>Connecting to wallet...</p>
      ) : error && !address ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <h2>Connected Address</h2>
          {address ? (
            <div className="address">{address}</div>
          ) : (
            <p>Not connected</p>
          )}

          <h2>Actions</h2>
          <button onClick={runScript}>Run Script</button>
          <button onClick={submitTransaction}>Submit Transaction</button>

          {scriptResult && (
            <div>
              <h2>Script Result</h2>
              <div className="result">{scriptResult}</div>
            </div>
          )}

          {txResult && (
            <div>
              <h2>Transaction Status</h2>
              <div className="result">{txResult}</div>
            </div>
          )}

          {error && (
            <div className="error">{error}</div>
          )}
        </>
      )}
    </div>
  )
}

export default App 