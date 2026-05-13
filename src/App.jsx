import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './lib/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Pets from './pages/Pets'
import Servicos from './pages/Servicos'
import Atendimentos from './pages/Atendimentos'
import Financeiro from './pages/Financeiro'
import Comissoes from './pages/Comissoes'
import Relatorios from './pages/Relatorios'
import { supabase } from './lib/supabase'
import { useState, useEffect } from 'react'

function Diagnostics() {
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function run() {
      const r = []
      const url = import.meta.env.VITE_SUPABASE_URL || ''
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

      r.push(`URL: ${url || 'VAZIA!'}`)
      r.push(`Key: ${key ? key.slice(0, 20) + '...' : 'VAZIA!'}`)

      try {
        const { data, error } = await supabase.from('clientes').select('id').limit(1)
        if (error) {
          r.push(`ERRO Supabase: ${error.message} (code: ${error.code})`)
          r.push(`Detalhes: ${error.details || 'nenhum'}`)
          r.push(`Hint: ${error.hint || 'nenhum'}`)
        } else {
          r.push(`Conexao OK! ${data?.length || 0} cliente(s) retornado(s)`)
        }
      } catch (err) {
        r.push(`FALHA DE REDE: ${err.message}`)
      }

      try {
        const res = await fetch(url + '/rest/v1/clientes?select=id&limit=1', {
          headers: {
            apikey: key,
            Authorization: 'Bearer ' + key,
          },
        })
        r.push(`Fetch direto: HTTP ${res.status}`)
        const text = await res.text()
        r.push(`Resposta: ${text.slice(0, 200)}`)
      } catch (err) {
        r.push(`Fetch direto FALHOU: ${err.message}`)
      }

      setResults(r)
      setDone(true)
    }
    run()
  }, [])

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 14, background: '#111', color: '#0f0', minHeight: '100vh' }}>
      <h2 style={{ color: '#fff' }}>Diagnostico Supabase</h2>
      {!done && <p>Testando...</p>}
      {results.map((line, i) => (
        <div key={i} style={{ marginBottom: 4, color: line.includes('ERRO') || line.includes('FALHA') || line.includes('VAZIA') ? '#f44' : '#0f0' }}>
          {line}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [showDiag, setShowDiag] = useState(false)

  return (
    <BrowserRouter>
      <ThemeProvider>
        {showDiag ? (
          <div>
            <button onClick={() => setShowDiag(false)} style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Voltar ao App
            </button>
            <Diagnostics />
          </div>
        ) : (
          <Layout>
            <button onClick={() => setShowDiag(true)} style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999, padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
              Diagnostico
            </button>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/pets" element={<Pets />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/atendimentos" element={<Atendimentos />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/comissoes" element={<Comissoes />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </Routes>
          </Layout>
        )}
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
