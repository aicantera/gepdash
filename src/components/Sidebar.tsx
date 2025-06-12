import React from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { useAuth } from '../contexts/AuthContext'
import {
  Home,
  Users,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Usuarios', href: '/usuarios' },
  { icon: FileText, label: 'Reportes', href: '/reportes' },
  { icon: BarChart3, label: 'Analíticas', href: '/analiticas' },
  { icon: Calendar, label: 'Calendario', href: '/calendario' },
  { icon: Settings, label: 'Configuración', href: '/configuracion' },
]

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Sistema</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-white hover:bg-slate-700 h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              'w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors duration-200',
              isCollapsed ? 'px-2' : 'px-3'
            )}
          >
            <item.icon className={cn('h-5 w-5', isCollapsed ? '' : 'mr-3')} />
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </Button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700 p-4">
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'space-x-3')}>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || 'Usuario'}
              </p>
              <p className="text-xs text-slate-400 truncate">En línea</p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full mt-3 text-slate-300 hover:text-white hover:bg-red-600/20 hover:border-red-500/30 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="text-sm">Cerrar Sesión</span>
          </Button>
        )}
        
        {isCollapsed && (
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="icon"
            className="w-full mt-3 text-slate-300 hover:text-white hover:bg-red-600/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
} 