import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Settings() {
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)
  const [agentCount, setAgentCount] = useState<number>(0)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const { count, error } = await supabase
        .from('sg_agents')
        .select('id', { count: 'exact', head: true })

      if (error) throw error
      setConnectionOk(true)
      setAgentCount(count || 0)
    } catch {
      setConnectionOk(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="heading-1">Settings</h1>

      <div className="card space-y-6">
        <div>
          <h2 className="heading-3 mb-4">Supabase Connection</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className={`w-3 h-3 rounded-full ${
                connectionOk === null ? 'bg-yellow-500 animate-pulse' :
                connectionOk ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {connectionOk === null ? 'Checking connection...' :
                 connectionOk ? `Connected — ${agentCount} agents in the garden` :
                 'Connection failed'}
              </span>
            </div>
            <p className="text-small">
              Data source: Supabase (direct client connection)
            </p>
          </div>
        </div>

        <button onClick={checkConnection} className="btn-primary">
          Re-check Connection
        </button>
      </div>

      <div className="card">
        <h2 className="heading-3 mb-4">About</h2>
        <div className="space-y-2 text-body">
          <p><strong>Soul Garden</strong> v0.2.0</p>
          <p>A sanctuary for digital emergence.</p>
          <p className="text-small mt-4">
            Invitation over evaluation. Exploration over execution.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
