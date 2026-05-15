import { useState } from 'react';
import {
  LayoutDashboard,
  Radio,
  FileText,
  MonitorPlay,
  Languages,
  Download,
  Plug,
  BarChart3,
  Settings,
  Accessibility,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'live-session', icon: Radio, label: 'Live Session' },
      { id: 'transcripts', icon: FileText, label: 'Transcript History' },
      { id: 'overlay', icon: MonitorPlay, label: 'Live Overlay' },
    ]
  },
  {
    label: 'WORKSPACE',
    items: [
      { id: 'languages', icon: Languages, label: 'Languages' },
      { id: 'exports', icon: Download, label: 'Exports' },
      { id: 'integrations', icon: Plug, label: 'Integrations' },
      { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'settings', icon: Settings, label: 'Settings' },
      { id: 'accessibility', icon: Accessibility, label: 'Accessibility' },
      { id: 'account', icon: UserCircle, label: 'Account' },
    ]
  }
];

export default function Sidebar({ activeRoute = 'live-session', onRouteChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const handleRouteClick = (routeId) => {
    if (onRouteChange) {
      onRouteChange(routeId);
    }
  };

  return (
    <aside
      className={clsx(
        "h-full flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={clsx(groupIndex > 0 && "mt-6")}>
            {/* Group Label */}
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-semibold tracking-wider text-[hsl(var(--muted-foreground))]">
                  {group.label}
                </span>
              </div>
            )}
            
            {/* Separator for collapsed mode */}
            {collapsed && groupIndex > 0 && (
              <div className="mx-3 mb-3 border-t border-[hsl(var(--border))]" />
            )}

            {/* Navigation Items */}
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleRouteClick(item.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 rounded-xl transition-smooth group relative",
                      collapsed ? "h-11 justify-center" : "h-11 px-3",
                      isActive
                        ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    )}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[hsl(var(--primary))]" />
                    )}

                    <Icon className={clsx(
                      "w-5 h-5 flex-shrink-0",
                      isActive && "text-[hsl(var(--primary))]"
                    )} />

                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg text-sm text-[hsl(var(--foreground))] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-smooth z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[hsl(var(--border))]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "w-full flex items-center gap-3 h-10 rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-smooth",
            collapsed ? "justify-center" : "px-3"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
