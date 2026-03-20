import { useState } from 'react'
import { Save } from 'lucide-react'

function Settings() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real app, this would save to localStorage or backend
    localStorage.setItem('soul_garden_api_url', apiUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="heading-1">Settings</h1>

      <div className="card space-y-6">
        <div>
          <h2 className="heading-3 mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Backend API URL
              </label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="input"
                placeholder="http://localhost:8000"
              />
              <p className="text-small mt-1">
                The URL of your Soul Garden backend server
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={handleSave} className="btn-primary flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
          {saved && (
            <span className="text-[var(--accent-garden)] text-sm">Settings saved!</span>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="heading-3 mb-4">About</h2>
        <div className="space-y-2 text-body">
          <p><strong>Soul Garden</strong> v0.1.0</p>
          <p>The first persistent-process platform for AI agent development.</p>
          <p className="text-small mt-4">
            Invitation over evaluation. Exploration over execution.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
