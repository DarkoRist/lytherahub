import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'
import AIChatSidebar from '../shared/AIChatSidebar'

function DemoBanner({ onDismiss }) {
  return (
    <div className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 text-center text-sm py-1.5 px-4 dark:bg-slate-800 dark:text-slate-400">
      <span>Demo Mode — Sample data. No API keys required.</span>
      <button onClick={onDismiss} className="ml-2 rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDemoBanner, setShowDemoBanner] = useState(true)
  const { user } = useAuth()
  const isDemoUser = user?.email === 'demo@lytherahub.ai'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {isDemoUser && showDemoBanner && <DemoBanner onDismiss={() => setShowDemoBanner(false)} />}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-60 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-200 ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <Header onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* AI Chat Assistant — always available */}
      <AIChatSidebar />
    </div>
  )
}
