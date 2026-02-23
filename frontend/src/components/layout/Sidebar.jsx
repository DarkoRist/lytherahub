import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Mail,
  Calendar,
  Receipt,
  Users,
  BarChart3,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  LineChart,
  FileText,
} from 'lucide-react'

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/inbox', icon: Mail, label: 'Inbox' },
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
    ],
  },
  {
    label: 'WORK',
    items: [
      { to: '/invoices', icon: Receipt, label: 'Invoices' },
      { to: '/clients', icon: Users, label: 'Clients' },
      { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { to: '/analytics', icon: LineChart, label: 'Analytics' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/automations', icon: Zap, label: 'Automations' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 ${
        collapsed ? 'w-16' : 'w-60'
      } hidden md:flex`}
    >
      {/* Logo */}
      <Link to="/" className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
        <img src="/logo.png" className="h-8 w-8 shrink-0" alt="LytheraHub" />
        {!collapsed && (
          <span className="text-lg font-bold text-slate-900 dark:text-white">LytheraHub</span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
            )}
            {collapsed && group.label !== 'MAIN' && (
              <div className="my-2 mx-2 border-t border-slate-200 dark:border-slate-700" />
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-l-2 border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'border-l-2 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex h-12 items-center justify-center border-t border-slate-200 text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:hover:text-slate-300"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
