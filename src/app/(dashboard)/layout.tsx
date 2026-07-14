'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  badge?: number
}

const navItems: NavItem[] = [
  { name: 'Fleet Logistics', href: '/admin/fleet', badge: 3 },
  { name: 'Project Finance', href: '/admin/finance' },
  { name: 'Bulk Import', href: '/admin/upload' },
  { name: 'Supervisor Entry', href: '/supervisor/operations' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'A'

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 shrink-0 bg-[#0B0F19] flex flex-col border-r border-white/5 max-md:hidden">
        <div className="px-5 pt-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20">
              B
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Browns</h2>
              <p className="text-[9px] text-blue-400/70 uppercase tracking-[0.2em] font-semibold">Control Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white shadow-sm shadow-blue-500/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-300',
                    isActive ? 'bg-blue-400 shadow-sm shadow-blue-400/50' : 'bg-slate-600 group-hover:bg-slate-400'
                  )} />
                  {item.name}
                </span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0B0F19] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email ?? 'admin@browns.lk'}</p>
            </div>
            <button onClick={() => signOut()} className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Sign out">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3 md:hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                B
              </div>
              <span className="text-sm font-bold text-slate-800">Browns ERP</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-600 font-medium">Browns Engineering & Constructions</span>
              <span className="text-slate-300">/</span>
              <span className="text-blue-600 font-medium">ERP Dashboard</span>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-all duration-200">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <button onClick={() => signOut()} className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:bg-slate-50 pr-2 py-1 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.name ?? 'Admin'}</p>
                  <p className="text-[10px] text-slate-400">{user?.email ?? 'Browns Engineering'}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  )
}
