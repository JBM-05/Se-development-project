import {
  Archive,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Tags,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { loggedOut } from '../auth/authSlice'
import { sidebarClosed, sidebarToggled } from './layoutSlice'
import { LanguageSwitch } from './LanguageSwitch'
import { classNames } from '../../shared/lib/format'

const navItems = [
  { to: '/admin', labelKey: 'navigation.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/requests', labelKey: 'navigation.requests', icon: ClipboardList },
  { to: '/admin/states', labelKey: 'navigation.states', icon: Tags },
]

export function AdminLayout() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarOpen = useAppSelector((state) => state.layout.sidebarOpen)
  const admin = useAppSelector((state) => state.auth.admin)

  function logout() {
    dispatch(loggedOut())
    navigate('/admin/login', { replace: true })
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-e border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div>
          <p className="text-sm font-semibold text-slate-950">{t('app.admin')}</p>
          <p className="text-xs text-slate-500">{t('app.name')}</p>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => dispatch(sidebarClosed())}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => dispatch(sidebarClosed())}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold',
                  isActive
                    ? 'bg-slate-950 !text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('actions.logout')}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => dispatch(sidebarClosed())}
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:ps-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => dispatch(sidebarToggled())}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Archive className="hidden h-5 w-5 text-slate-400 sm:block" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {location.pathname === '/admin'
                  ? t('navigation.dashboard')
                  : location.pathname.includes('/states')
                    ? t('navigation.states')
                    : t('navigation.requests')}
              </p>
              <p className="text-xs text-slate-500">{admin?.email}</p>
            </div>
          </div>
          <LanguageSwitch />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
