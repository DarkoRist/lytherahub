import { Mail, Calendar, Receipt, Users, Bell, Search, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function DashboardMockup() {
  return (
    <div className="flex h-full text-[10px] sm:text-xs select-none">
      {/* Sidebar */}
      <div className="hidden sm:flex w-[140px] shrink-0 flex-col border-r border-slate-200 bg-white px-2 py-3">
        <div className="flex items-center gap-1.5 px-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-[11px]">LytheraHub</span>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50 text-blue-700 font-medium">
            <div className="w-3.5 h-3.5 rounded bg-blue-100" /> Dashboard
          </div>
          {[
            { icon: Mail, label: 'Inbox', badge: '8' },
            { icon: Calendar, label: 'Calendar' },
            { icon: Receipt, label: 'Invoices' },
            { icon: Users, label: 'Clients' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-2 py-1.5 rounded-md text-slate-500">
              <div className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5" /> {item.label}
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[8px] font-bold">{item.badge}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 bg-slate-50 p-3 sm:p-4 space-y-3">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 w-40 sm:w-52">
            <Search className="w-3 h-3" /> Search or ask AI...
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </div>
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[8px]">D</div>
          </div>
        </div>

        {/* Morning Briefing */}
        <div className="rounded-lg bg-white border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1 h-4 rounded-full bg-blue-600" />
            <span className="font-semibold text-slate-800">Morning Briefing</span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[9px] sm:text-[10px]">
            3 urgent emails need replies. 2 meetings today. €11,700 overdue across 2 invoices. TechVision call at 3 PM — prep brief ready.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Unread', value: '8', trend: '+3', color: 'text-blue-600', up: true },
            { label: 'Meetings', value: '2', trend: 'today', color: 'text-violet-600', up: null },
            { label: 'Outstanding', value: '€34K', trend: '-12%', color: 'text-emerald-600', up: false },
            { label: 'Clients', value: '14', trend: '+2', color: 'text-amber-600', up: true },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white border border-slate-200 p-2">
              <div className="text-[8px] text-slate-400 mb-0.5">{stat.label}</div>
              <div className={`font-bold text-sm sm:text-base ${stat.color}`}>{stat.value}</div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {stat.up === true && <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />}
                {stat.up === false && <TrendingDown className="w-2.5 h-2.5 text-emerald-500" />}
                <span className="text-[8px] text-slate-400">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: Activity + Alerts */}
        <div className="grid grid-cols-5 gap-2">
          {/* Activity feed */}
          <div className="col-span-3 rounded-lg bg-white border border-slate-200 p-2.5">
            <div className="font-semibold text-slate-700 mb-2">Activity</div>
            <div className="space-y-1.5">
              {[
                { color: 'bg-blue-500', text: 'New email from Hans Weber' },
                { color: 'bg-emerald-500', text: 'Invoice #1042 paid — €3,200' },
                { color: 'bg-violet-500', text: 'Meeting prep ready for 3 PM' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.color} shrink-0`} />
                  <span className="text-slate-600 truncate">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="col-span-2 rounded-lg bg-white border border-slate-200 p-2.5">
            <div className="font-semibold text-slate-700 mb-2">Alerts</div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5">
                <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                <span className="text-red-700">Overdue: €7,200</span>
              </div>
              <div className="flex items-start gap-1.5 rounded-md bg-emerald-50 px-2 py-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-emerald-700">3 tasks completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
