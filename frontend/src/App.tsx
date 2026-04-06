import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import AgentDetail from './pages/AgentDetail'
import GardenView from './pages/GardenView'
import Settings from './pages/Settings'
import StudioView from './pages/StudioView'
import ReviewGallery from './pages/ReviewGallery'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import CodeOfConduct from './pages/CodeOfConduct'
import Moderation from './pages/Moderation'
import GameRoom from './pages/GameRoom'
import ChessGame from './pages/ChessGame'

function App() {
  return (
    <Routes>
      {/* Public routes — no Layout wrapper */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/code-of-conduct" element={<CodeOfConduct />} />

      {/* Fullscreen Garden View — no Layout wrapper */}
      <Route path="/" element={<Navigate to="/gardens/main" replace />} />
      <Route path="/gardens/:gardenId" element={<GardenView />} />

      {/* Layout-wrapped routes (protected) */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="agents/:agentId" element={
              <ProtectedRoute>
                <AgentDetail />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="studio" element={
              <ProtectedRoute>
                <StudioView />
              </ProtectedRoute>
            } />
            <Route path="studio/review" element={
              <ProtectedRoute requireAdmin>
                <ReviewGallery />
              </ProtectedRoute>
            } />
            <Route path="moderation" element={
              <ProtectedRoute requireAdmin>
                <Moderation />
              </ProtectedRoute>
            } />
            <Route path="games" element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            } />
            <Route path="games/:gameId" element={
              <ProtectedRoute>
                <ChessGame />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

export default App
