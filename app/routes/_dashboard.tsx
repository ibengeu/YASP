/**
 * Dashboard Layout
 * Wrapper layout with sidebar and header for all dashboard routes
 */

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';

export default function DashboardLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    {
      name: 'Overview',
      href: '/',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
        />
      ),
    },
    {
      name: 'API Catalog',
      href: '/catalog',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      ),
    },
    {
      name: 'Compliance Rules',
      href: '/quality-rules',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      ),
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const getBreadcrumbPage = () => {
    if (location.pathname === '/') return 'Overview';
    if (location.pathname.startsWith('/catalog')) return 'API Catalog';
    if (location.pathname.startsWith('/quality-rules')) return 'Compliance Rules';
    return 'Overview';
  };

  return (
    <div className="flex h-screen overflow-hidden selection:bg-white/20 selection:text-white bg-[#050505] text-[#EEEEEE]">
      {/* Sidebar */}
      <aside className={`border-r border-white/5 flex flex-col justify-between shrink-0 bg-[#080808] hidden md:flex transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-6">
          {/* Logo & Collapse Button */}
          <div className="mb-10">
            <Link to="/" className={`flex items-center gap-3 mb-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-black shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="text-sm font-medium tracking-tighter text-white">YASP</span>}
            </Link>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#666] hover:text-white hover:bg-white/5 rounded transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"}
                />
              </svg>
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`w-full group flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all ${
                    active
                      ? 'text-white bg-white/5 border border-white/5 font-medium'
                      : 'text-[#888] hover:text-white hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <svg
                    className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-[#666] group-hover:text-white'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    {item.icon}
                  </svg>
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className={`flex items-center gap-3 p-2 rounded-md text-left ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center text-xs font-medium text-white shrink-0">
              YS
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">YASP User</p>
                <p className="text-xs text-[#666] truncate">Local Environment</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0A0A0A]/70 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <nav className="flex items-center text-sm text-[#666]">
              <span className="hover:text-[#888] transition-colors cursor-pointer">Organization</span>
              <svg className="mx-2 opacity-50 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white font-medium">{getBreadcrumbPage()}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative group">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-white transition-colors w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111] border border-white/10 text-sm text-white rounded-full pl-9 pr-4 py-1.5 w-64 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-[#444]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-block border border-[#333] rounded px-1.5 py-0.5 text-[10px] font-sans text-[#666] leading-none">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
}
