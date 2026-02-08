/**
 * Dashboard Layout
 * Wrapper layout with sidebar and header for all dashboard routes
 */

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { DEFAULT_USER_PROFILE } from '@/lib/constants';

export default function DashboardLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
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
  ];

  const isActive = (href: string) => {
    return location.pathname.startsWith(href);
  };

  const getBreadcrumbPage = () => {
    if (location.pathname.startsWith('/catalog')) return 'API Catalog';
    if (location.pathname.startsWith('/editor')) return 'Editor';
    return 'API Catalog';
  };

  return (
    <div className="flex h-screen overflow-hidden selection:bg-primary/20 selection:text-foreground bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`border-r border-border flex flex-col justify-between shrink-0 bg-card hidden md:flex transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-6">
          {/* Logo & Collapse Button */}
          <div className="mb-10">
            <Link to="/" className={`flex items-center gap-3 mb-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shrink-0 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="text-sm font-semibold tracking-tight text-foreground">YASP</span>}
            </Link>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
                  className={`w-full group flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all relative ${
                    active
                      ? 'text-foreground font-medium bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {/* Active indicator dot */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" />
                  )}

                  <svg
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
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
        <div className="p-4 border-t border-border">
          <div className={`flex items-center gap-3 p-2 rounded-md text-left hover:bg-muted transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 border border-border flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
              {DEFAULT_USER_PROFILE.initials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{DEFAULT_USER_PROFILE.name}</p>
                <p className="text-xs text-muted-foreground truncate">{DEFAULT_USER_PROFILE.subtitle}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-background">
        {/* Header - Modern minimalist design */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {/* Breadcrumb with refined typography */}
            <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-pointer">Organization</span>
              <svg className="mx-2 w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex items-center gap-2">
                {/* Active page indicator dot */}
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-foreground font-semibold">{getBreadcrumbPage()}</span>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search - refined styling */}
            <div className="relative group">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted/50 border border-border text-sm text-foreground rounded-full pl-9 pr-14 py-2 w-40 sm:w-64 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all placeholder:text-muted-foreground"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-block border border-border bg-background rounded px-1.5 py-0.5 text-[10px] font-sans text-muted-foreground leading-none">
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
