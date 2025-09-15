'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Menu, X, Home, FileText, CheckCircle, Package, 
  Code, CreditCard, Users, Settings, TrendingUp,
  DollarSign, ShoppingCart, Send, Mail, Hammer, GitBranch, ChefHat,
  Zap, Layers
} from 'lucide-react'

interface SidebarProps {
  currentView?: string
  onNavigate?: (view: string) => void
  onQuickInvoice?: () => void
}

export default function Sidebar({ currentView, onNavigate, onQuickInvoice }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true) // Default to open on desktop

  const handleNavigation = (view: string) => {
    onNavigate?.(view)
    setIsOpen(false) // Close on mobile after navigation
  }

  const handleQuickInvoice = () => {
    onQuickInvoice?.()
    setIsOpen(false)
  }

  const navItems = [
    { id: 'quick-invoice', label: '⚡ Quick Invoice', icon: Zap, onClick: true, priority: true },
    { type: 'divider' },
    { id: 'invoices', label: 'All Invoices', icon: FileText, onClick: true },
    { id: 'paid-invoices', label: 'Paid Invoices', icon: DollarSign, onClick: true },
    { type: 'divider' },
    { id: 'products', label: 'Products', icon: Package, onClick: true },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Always visible on desktop */}
      <aside className={`
        fixed left-0 top-0 h-full bg-white shadow-lg z-40 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        w-64
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Invoice System</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item, index) => {
                if (item.type === 'divider') {
                  return <li key={index} className="my-2 border-t border-gray-200" />
                }

                const Icon = item.icon!
                const isActive = item.onClick && currentView === item.id
                
                // Priority items with special styling
                const priorityClass = item.priority 
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-200' 
                  : ''
                
                if (item.onClick) {
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavigation(item.id!)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                          ${isActive 
                            ? 'bg-blue-50 text-blue-600' 
                            : priorityClass || 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className={`font-medium ${item.priority && !isActive ? 'text-purple-700' : ''}`}>
                          {item.label}
                        </span>
                      </button>
                    </li>
                  )
                }

                // Default case - shouldn't happen but TypeScript needs it
                return null
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-gray-500">
              <p>Version 2.0.0</p>
              <p className="mt-1">© 2024 AusBeds</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}