import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, PawPrint, Scissors, Calendar, DollarSign, FileText, Percent, Menu, X, Sparkles, LayoutGrid } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/pets', icon: PawPrint, label: 'Pets' },
  { to: '/servicos', icon: Scissors, label: 'Servicos' },
  { to: '/atendimentos', icon: Calendar, label: 'Atendimentos' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/relatorios', icon: FileText, label: 'Relatorios' },
  { to: '/comissoes', icon: Percent, label: 'Comissoes' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isGlass, toggleTheme } = useTheme()

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? isGlass
          ? 'bg-purple-200/60 text-purple-800'
          : 'bg-blue-50 text-blue-700'
        : isGlass
          ? 'text-gray-700 hover:bg-purple-100/40 hover:text-gray-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Title */}
        <div className={`flex items-center justify-between h-16 px-4 border-b ${isGlass ? 'border-violet-200/25' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <PawPrint className={`w-7 h-7 ${isGlass ? 'text-violet-700' : 'text-blue-600'}`} />
            <span className={`text-xl font-bold ${isGlass ? 'text-gray-900' : 'text-gray-900'}`}>PetShop</span>
          </div>
          <button
            className={`p-1 rounded-md lg:hidden ${isGlass ? 'text-gray-500 hover:text-gray-700 hover:bg-purple-100/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setSidebarOpen(false)}
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
              end={to === '/'}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className={`px-3 py-4 border-t ${isGlass ? 'border-violet-200/25' : 'border-gray-200'}`}>
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
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <header className={`sticky top-0 z-20 flex items-center h-16 px-4 bg-white border-b lg:hidden ${isGlass ? 'border-violet-200/25 bg-white/50 backdrop-blur-xl' : 'border-gray-200'}`}>
          <button
            className={`p-1 rounded-md ${isGlass ? 'text-gray-500 hover:text-gray-700 hover:bg-purple-100/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <PawPrint className={`w-6 h-6 ${isGlass ? 'text-violet-700' : 'text-blue-600'}`} />
            <span className={`text-lg font-bold ${isGlass ? 'text-gray-900' : 'text-gray-900'}`}>PetShop</span>
          </div>
          {/* Mobile theme toggle */}
          <button
            onClick={toggleTheme}
            className={`ml-auto p-2 rounded-lg transition-colors ${isGlass ? 'text-violet-700 hover:bg-purple-100/40' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {isGlass ? <Sparkles className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
