import { useState } from 'react';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  Languages,
  Radio,
  User,
  LogOut,
  HelpCircle,
  Mic
} from 'lucide-react';
import clsx from 'clsx';

export default function TopNavBar({ sessionTitle = "Live Session", isLive = true }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Kiswahili');

  const notifications = [
    { id: 1, title: 'Session saved', time: '2 min ago', read: false },
    { id: 2, title: 'Translation quality improved', time: '15 min ago', read: true },
    { id: 3, title: 'New language pair available', time: '1 hour ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 h-16 glass border-b border-[hsl(var(--border))]">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left Section: Logo & Session */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
              <Mic className="w-5 h-5 text-[hsl(var(--primary-foreground))]" />
            </div>
            <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
              CaptionLive
            </span>
          </div>

          {/* Session Title */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--secondary))]">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">{sessionTitle}</span>
          </div>
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search transcripts, sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[hsl(var(--secondary))] border border-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none transition-smooth"
            />
          </div>
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-2">
          {/* Language Pair Selector */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
            <Languages className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span className="text-sm text-[hsl(var(--foreground))]">{sourceLang}</span>
            <ChevronDown className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            <span className="text-[hsl(var(--muted-foreground))]">/</span>
            <span className="text-sm text-[hsl(var(--foreground))]">{targetLang}</span>
            <ChevronDown className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
          </div>

          {/* Live Status Badge */}
          <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            isLive
              ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          )}>
            <Radio className={clsx("w-3.5 h-3.5", isLive && "animate-pulse")} />
            <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-smooth"
            >
              <Bell className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-[hsl(var(--primary-foreground))] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-[hsl(var(--border))]">
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={clsx(
                        "p-4 border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))] transition-smooth cursor-pointer",
                        !notification.read && "bg-[hsl(var(--primary))]/5"
                      )}
                    >
                      <p className="text-sm text-[hsl(var(--foreground))]">{notification.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button className="w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-smooth">
            <Settings className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-xl bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--muted))] transition-smooth"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
                <User className="w-4 h-4 text-[hsl(var(--primary-foreground))]" />
              </div>
              <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-[hsl(var(--border))]">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Alex Morgan</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">alex@captionlive.io</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-smooth">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-smooth">
                    <HelpCircle className="w-4 h-4" />
                    Help Center
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 transition-smooth">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
