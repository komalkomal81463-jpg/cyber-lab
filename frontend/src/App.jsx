import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LabsPage from './pages/LabsPage'
import LabPage from './pages/LabPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore()
  if (!token) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { fetchMe, token } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="labs" element={<LabsPage />} />
          <Route path="labs/:slug" element={<LabPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
