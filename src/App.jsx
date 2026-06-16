import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/ThemeContext'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
// import Login from './pages/Login' -- bypass auth
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Pets from './pages/Pets'
import Servicos from './pages/Servicos'
import Atendimentos from './pages/Atendimentos'
import Financeiro from './pages/Financeiro'
import Comissoes from './pages/Comissoes'
import Relatorios from './pages/Relatorios'
import Backup from './pages/Backup'

// Importar funções de backup
import { performAutomaticBackup } from './lib/backup'

function App() {
  // Executar backup automático quando a aplicação for carregada
  // Isso garante que o backup seja feito mesmo se o usuário não acessar a página de backup
  performAutomaticBackup()

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/pets" element={<Pets />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/atendimentos" element={<Atendimentos />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/comissoes" element={<Comissoes />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/backup" element={<Backup />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
