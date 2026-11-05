import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './lib/ThemeContext'
import { AuthProvider } from './hooks/useAuth'
import { useAuth } from './hooks/useAuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Spinner from './components/Spinner'
import AnimatedPage from './components/AnimatedPage'
import Login from './pages/Login'
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Pets from './pages/Pets'
import Servicos from './pages/Servicos'
const Atendimentos = lazy(() => import('./pages/Atendimentos'))
const Financeiro = lazy(() => import('./pages/Financeiro'))
import Comissoes from './pages/Comissoes'
const Relatorios = lazy(() => import('./pages/Relatorios'))
import Backup from './pages/Backup'

// Importar funções de backup
import { performAutomaticBackup } from './lib/backup'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function AutomaticBackupRunner() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user) return
    const run = () => { if (!document.hidden) void performAutomaticBackup(user.id) }
    run()
    const timer = setInterval(run, 60_000)
    document.addEventListener('visibilitychange', run)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', run)
    }
  }, [loading, user])

  return null
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AutomaticBackupRunner />
          <ThemeProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar-senha" element={<Suspense fallback={<Spinner />}><ForgotPassword /></Suspense>} />
              <Route path="/redefinir-senha" element={<Suspense fallback={<Spinner />}><ResetPassword /></Suspense>} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ErrorBoundary><AnimatedPage><Dashboard /></AnimatedPage></ErrorBoundary>} />
                <Route path="/clientes" element={<ErrorBoundary><AnimatedPage><Clientes /></AnimatedPage></ErrorBoundary>} />
                <Route path="/pets" element={<ErrorBoundary><AnimatedPage><Pets /></AnimatedPage></ErrorBoundary>} />
                <Route path="/servicos" element={<ErrorBoundary><AnimatedPage><Servicos /></AnimatedPage></ErrorBoundary>} />
                <Route path="/atendimentos" element={<Suspense fallback={<Spinner />}><ErrorBoundary><AnimatedPage><Atendimentos /></AnimatedPage></ErrorBoundary></Suspense>} />
                <Route path="/financeiro" element={<Suspense fallback={<Spinner />}><ErrorBoundary><AnimatedPage><Financeiro /></AnimatedPage></ErrorBoundary></Suspense>} />
                <Route path="/comissoes" element={<ErrorBoundary><AnimatedPage><Comissoes /></AnimatedPage></ErrorBoundary>} />
                <Route path="/relatorios" element={<Suspense fallback={<Spinner />}><ErrorBoundary><AnimatedPage><Relatorios /></AnimatedPage></ErrorBoundary></Suspense>} />
                <Route path="/backup" element={<ErrorBoundary><AnimatedPage><Backup /></AnimatedPage></ErrorBoundary>} />
              </Route>
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
