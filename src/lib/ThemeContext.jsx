import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('petshop-theme') || 'padrao'
    } catch {
      return 'padrao'
    }
  })

  useEffect(() => {
    localStorage.setItem('petshop-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'padrao' ? 'glass' : 'padrao'))
  }

  const isGlass = theme === 'glass'

  return (
    <ThemeContext.Provider value={{ theme, isGlass, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
