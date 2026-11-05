import { ThemeContext } from './theme-context'
import { useState, useEffect } from 'react'


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
