import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import ProtectedRoute from './auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import CommandPalette from './components/shared/CommandPalette'
import OnboardingWizard from './components/onboarding/OnboardingWizard'

import LoginPage from './auth/LoginPage'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Calendar from './pages/Calendar'
import Invoices from './pages/Invoices'
import Clients from './pages/Clients'
import Tasks from './pages/Tasks'
import Reports from './pages/Reports'
import Analytics from './pages/Analytics'
import Automations from './pages/Automations'
import Settings from './pages/Settings'
import Signals from './pages/Signals'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import SalesOrders from './pages/SalesOrders'
import PurchaseOrders from './pages/PurchaseOrders'
import PrivacyPolicy from './pages/legal/PrivacyPolicy'
import TermsOfService from './pages/legal/TermsOfService'
import CookiePolicy from './pages/legal/CookiePolicy'

function AppLayout({ children, onOpenPalette }) {
  return (
    <ProtectedRoute>
      <Layout onOpenPalette={onOpenPalette}>{children}</Layout>
    </ProtectedRoute>
  )
}

const SHORTCUTS = [
  { key: '⌘K', desc: 'Open command palette' },
  { key: 'G D', desc: 'Go to Dashboard' },
  { key: 'G I', desc: 'Go to Inbox' },
  { key: 'G C', desc: 'Go to Calendar' },
  { key: 'G V', desc: 'Go to Invoices' },
  { key: 'G P', desc: 'Go to Clients (Pipeline)' },
  { key: 'G T', desc: 'Go to Tasks' },
  { key: 'G R', desc: 'Go to Reports' },
  { key: '?', desc: 'Show this shortcuts overlay' },
  { key: 'Esc', desc: 'Close modals / overlays' },
]

function App() {
  const navigate = useNavigate()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    let lastKey = ''
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
        return
      }

      if (e.key === '?') { setShowShortcuts(true); return }
      if (e.key === 'Escape') { setShowShortcuts(false); setPaletteOpen(false); return }

      if (lastKey === 'g') {
        const navMap = { d: '/dashboard', i: '/inbox', c: '/calendar', v: '/invoices', p: '/clients', t: '/tasks', r: '/reports' }
        if (navMap[e.key.toLowerCase()]) navigate(navMap[e.key.toLowerCase()])
      }
      lastKey = e.key.toLowerCase()
      setTimeout(() => { lastKey = '' }, 1000)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [navigate])

  const handleOpenPalette = useCallback(() => setPaletteOpen(true), [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<AppLayout onOpenPalette={handleOpenPalette}><Dashboard /></AppLayout>} />
        <Route path="/inbox" element={<AppLayout onOpenPalette={handleOpenPalette}><Inbox /></AppLayout>} />
        <Route path="/calendar" element={<AppLayout onOpenPalette={handleOpenPalette}><Calendar /></AppLayout>} />
        <Route path="/invoices" element={<AppLayout onOpenPalette={handleOpenPalette}><Invoices /></AppLayout>} />
        <Route path="/clients" element={<AppLayout onOpenPalette={handleOpenPalette}><Clients /></AppLayout>} />
        <Route path="/tasks" element={<AppLayout onOpenPalette={handleOpenPalette}><Tasks /></AppLayout>} />
        <Route path="/reports" element={<AppLayout onOpenPalette={handleOpenPalette}><Reports /></AppLayout>} />
        <Route path="/analytics" element={<AppLayout onOpenPalette={handleOpenPalette}><Analytics /></AppLayout>} />
        <Route path="/automations" element={<AppLayout onOpenPalette={handleOpenPalette}><Automations /></AppLayout>} />
        <Route path="/settings" element={<AppLayout onOpenPalette={handleOpenPalette}><Settings /></AppLayout>} />
        <Route path="/contacts" element={<AppLayout onOpenPalette={handleOpenPalette}><Contacts /></AppLayout>} />
        <Route path="/deals" element={<AppLayout onOpenPalette={handleOpenPalette}><Deals /></AppLayout>} />
        <Route path="/products" element={<AppLayout onOpenPalette={handleOpenPalette}><Products /></AppLayout>} />
        <Route path="/inventory" element={<AppLayout onOpenPalette={handleOpenPalette}><Inventory /></AppLayout>} />
        <Route path="/sales-orders" element={<AppLayout onOpenPalette={handleOpenPalette}><SalesOrders /></AppLayout>} />
        <Route path="/purchase-orders" element={<AppLayout onOpenPalette={handleOpenPalette}><PurchaseOrders /></AppLayout>} />
        <Route path="/signals" element={<AppLayout onOpenPalette={handleOpenPalette}><Signals /></AppLayout>} />
      </Routes>

      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {SHORTCUTS.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{desc}</span>
                  <kbd className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global command palette — wired here so it works from every page */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}

export default App
