import { NavLink, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Mail,
  Calendar,
  Receipt,
  BarChart3,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  LineChart,
  Package,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Building2,
  UserRound,
  Handshake,
  Bell,
  Banknote,
} from 'lucide-react'
import { workspaceApi } from '../../api/workspace'

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/inbox', icon: Mail, label: 'Inbox', badge: 12 },
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
    ],
  },
  {
    label: 'SALES',
    items: [
      { to: '/clients', icon: Building2, label: 'Companies' },
      { to: '/contacts', icon: UserRound, label: 'Contacts' },
      { to: '/deals', icon: Handshake, label: 'Deals' },
      { to: '/tasks', icon: CheckSquare, label: 'Tasks', badge: 2 },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/products', icon: Package, label: 'Products' },
      { to: '/inventory', icon: Boxes, label: 'Inventory' },
      { to: '/sales-orders', icon: ShoppingCart, label: 'Sales Orders' },
      { to: '/purchase-orders', icon: ClipboardList, label: 'Purchase Orders' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { to: '/invoices', icon: Receipt, label: 'Invoices' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { to: '/signals', icon: Bell, label: 'Signals' },
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
  const [workspaceName, setWorkspaceName] = useState('Workspace')

  useEffect(() => {
    workspaceApi.get()
      .then((r) => {
        const name = r.data?.name || r.data?.workspace?.name
        if (name) setWorkspaceName(name)
      })
      .catch(() => {})
  }, [])

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 ${
        collapsed ? 'w-16' : 'w-60'
      } hidden md:flex`}
    >
      {/* Logo + workspace name */}
      <Link to="/" className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 px-4 dark:border-slate-700">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-sm font-bold text-white">L</span>
        </div>
        {!collapsed && (
          <span className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {workspaceName}
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
            )}
            {collapsed && group.label !== 'MAIN' && (
              <div className="my-2 mx-2 border-t border-slate-100 dark:border-slate-800" />
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="relative shrink-0">
                    <Icon className="h-[18px] w-[18px]" />
                    {collapsed && badge > 0 && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  {!collapsed && <span className="flex-1 truncate">{label}</span>}
                  {!collapsed && badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 shrink-0 items-center justify-center border-t border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
