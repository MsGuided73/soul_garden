import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AgentDetail from './pages/AgentDetail'
import GardenView from './pages/GardenView'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      {/* Fullscreen Garden View — no Layout wrapper */}
      <Route path="/" element={<Navigate to="/gardens/main" replace />} />
      <Route path="/gardens/:gardenId" element={<GardenView />} />

      {/* Layout-wrapped routes */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="agents/:agentId" element={<AgentDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

export default App
