import { Routes, Route } from 'react-router-dom'
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

function App() {
  return (
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
  )
}

export default App
