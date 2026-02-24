import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import ProtectedRoute from './auth/ProtectedRoute'
import Layout from './components/layout/Layout'
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
import PrivacyPolicy from './pages/legal/PrivacyPolicy'
import TermsOfService from './pages/legal/TermsOfService'
import CookiePolicy from './pages/legal/CookiePolicy'

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

const SHORTCUTS = [
  { key: '⌘K', desc: 'Focus command bar' },
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

  useEffect(() => {
    let lastKey = ''
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === '?') { setShowShortcuts(true); return }
      if (e.key === 'Escape') { setShowShortcuts(false); return }

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

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/inbox" element={<AppLayout><Inbox /></AppLayout>} />
        <Route path="/calendar" element={<AppLayout><Calendar /></AppLayout>} />
        <Route path="/invoices" element={<AppLayout><Invoices /></AppLayout>} />
        <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
        <Route path="/tasks" element={<AppLayout><Tasks /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
        <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
        <Route path="/automations" element={<AppLayout><Automations /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
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
    </>
  )
}

export default App
