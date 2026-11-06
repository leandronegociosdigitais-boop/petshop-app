import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { Home, Users, PawPrint, Scissors, Calendar, DollarSign, FileText, Percent, Menu, X, Sparkles, LayoutGrid, LogOut, Database } from 'lucide-react'
import { useTheme } from '../lib/useTheme'
import { useAuth } from '../hooks/useAuthContext'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/pets', icon: PawPrint, label: 'Pets' },
  { to: '/servicos', icon: Scissors, label: 'Servicos' },
  { to: '/atendimentos', icon: Calendar, label: 'Atendimentos' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/relatorios', icon: FileText, label: 'Relatorios' },
  { to: '/comissoes', icon: Percent, label: 'Comissoes' },
  { to: '/backup', icon: Database, label: 'Backup' },
]

export default function Layout() {
  const menuButton = useRef(null)
  const drawer = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isGlass, toggleTheme } = useTheme()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!sidebarOpen || !window.matchMedia('(max-width: 1023px)').matches) return
    const previous = document.body.style.overflow
    const returnFocus = menuButton.current
    document.body.style.overflow = 'hidden'
    const focusable = () => [...drawer.current.querySelectorAll('a, button')].filter(node => node.getClientRects().length)
    focusable()[0]?.focus()
    function handleKey(event) {
      if (event.key === 'Escape') setSidebarOpen(false)
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0], last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', handleKey)
      returnFocus?.focus()
    }
  }, [sidebarOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? isGlass
          ? 'bg-purple-200/60 text-purple-800 border-l-2 border-purple-600'
          : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
        : isGlass
          ? 'text-gray-700 hover:bg-purple-100/40 hover:text-gray-900 border-l-2 border-transparent'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent'
    }`

  const sidebarContent = (
    <>
      {/* Logo / Title */}
      <div className={`flex items-center justify-between h-16 px-4 border-b ${isGlass ? 'border-violet-200/25' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <PawPrint className={`w-7 h-7 ${isGlass ? 'text-violet-700' : 'text-blue-600'}`} />
          <span className={`text-xl font-bold ${isGlass ? 'text-gray-900' : 'text-gray-900'}`}>PetShop</span>
        </div>
        <button
          className={`p-1 rounded-md lg:hidden ${isGlass ? 'text-gray-500 hover:text-gray-700 hover:bg-purple-100/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={linkClasses}
            onClick={() => setSidebarOpen(false)}
            end={to === '/dashboard'}
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section: Theme toggle + Sair */}
      <div className={`px-3 py-4 border-t space-y-2 ${isGlass ? 'border-violet-200/25' : 'border-gray-200'}`}>
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isGlass
              ? 'bg-gradient-to-r from-purple-200/60 to-violet-100/60 text-violet-800 hover:from-purple-100/80 hover:to-indigo-100/80 border border-purple-200/30'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {isGlass ? <Sparkles className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          {isGlass ? 'Layout Glass' : 'Layout Padrao'}
        </button>
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isGlass
              ? 'text-red-600 hover:bg-red-100/40'
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div className={`app-shell min-h-screen bg-gray-50 ${sidebarOpen ? 'mobile-menu-open' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside ref={drawer} id="app-navigation" aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <header className={`app-mobile-header sticky top-0 z-20 flex items-center h-16 px-4 bg-white border-b lg:hidden ${isGlass ? 'border-violet-200/25 bg-white/50 backdrop-blur-xl' : 'border-gray-200'}`}>
          <button
            className={`p-1 rounded-md ${isGlass ? 'text-gray-500 hover:text-gray-700 hover:bg-purple-100/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            ref={menuButton} aria-label="Abrir menu" aria-expanded={sidebarOpen} aria-controls="app-navigation" onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <PawPrint className={`w-6 h-6 ${isGlass ? 'text-violet-700' : 'text-blue-600'}`} />
            <span className={`text-lg font-bold ${isGlass ? 'text-gray-900' : 'text-gray-900'}`}>PetShop</span>
          </div>
          {/* Mobile right actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme} aria-label="Alternar aparência"
              className={`p-2 rounded-lg transition-colors ${isGlass ? 'text-violet-700 hover:bg-purple-100/40' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {isGlass ? <Sparkles className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignOut} aria-label="Sair da conta"
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="app-main p-4 sm:p-6 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
          <Outlet />
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Navegação rápida">
        {[navItems[0], navItems[4], navItems[1], navItems[5]].map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? 'mobile-nav-active' : ''}>
            <Icon size={21} /><span>{label === 'Atendimentos' ? 'Agenda' : label === 'Dashboard' ? 'Início' : label}</span>
          </NavLink>
        ))}
        <button type="button" aria-label="Mais opções" aria-expanded={sidebarOpen} aria-controls="app-navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /><span>Mais</span></button>
      </nav>
    </div>
  )
}
