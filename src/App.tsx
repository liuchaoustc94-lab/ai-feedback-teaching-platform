import { useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useSearchParams } from 'react-router'
import Lenis from '@studio-freight/lenis'
import HomePage from './pages/HomePage'
import PoseAnalysisPage from './pages/PoseAnalysisPage'
import TrainingArchivePage from './pages/TrainingArchivePage'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import ForbiddenPage from './pages/ForbiddenPage'
import AdminUsersPage from './pages/AdminUsersPage'
import DataCenterPage from './pages/DataCenterPage'
import { AuthProvider, RequireAdmin, RequireAuth, RequireModule, useAuth } from './auth/AuthContext'
import { MODULE_KEYS, moduleForLesson } from './lib/modules'

function HomeRoute() {
  const navigate = useNavigate()
  const { isAdmin, modules, user, signOut } = useAuth()
  return (
    <HomePage
      visibleModules={isAdmin ? MODULE_KEYS : modules}
      isAdmin={isAdmin}
      userLabel={user?.displayName ?? user?.username ?? undefined}
      userName={user?.username}
      onLogout={() => void signOut()}
      onDataExport={() => navigate('/data-center')}
    />
  )
}

function PoseRoute() {
  const [searchParams] = useSearchParams()
  const moduleKey = moduleForLesson(searchParams.get('lesson')) ?? 'motor-coordination'
  return (
    <RequireModule moduleKey={moduleKey}>
      <PoseAnalysisPage />
    </RequireModule>
  )
}

function AppContent() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={<RequireAuth allowPasswordChange><ChangePasswordPage /></RequireAuth>}
      />
      <Route path="/forbidden" element={<RequireAuth><ForbiddenPage /></RequireAuth>} />
      <Route path="/" element={<RequireAuth><HomeRoute /></RequireAuth>} />
      <Route path="/pose-analysis" element={<RequireAuth><PoseRoute /></RequireAuth>} />
      <Route
        path="/training-archive"
        element={<RequireAuth><RequireModule moduleKey="training-archive"><TrainingArchivePage /></RequireModule></RequireAuth>}
      />
      <Route
        path="/data-center"
        element={<RequireAuth><RequireModule moduleKey="data-center"><DataCenterPage /></RequireModule></RequireAuth>}
      />
      <Route
        path="/admin/users"
        element={<RequireAuth><RequireAdmin><AdminUsersPage /></RequireAdmin></RequireAuth>}
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
