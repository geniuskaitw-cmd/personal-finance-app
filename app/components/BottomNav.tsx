'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';

const navItems = [
  { href: '/today', icon: Home, label: '記帳' },
  { href: '/calendar', icon: CalendarDays, label: '行事曆' },
  { href: '/stats', icon: BarChart3, label: '統計' },
  { href: '/settings', icon: SettingsIcon, label: '設定' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t-2 border-primary/30 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/today' && pathname === '/monthly');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className={`px-4 py-1 rounded-md transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground group-hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
