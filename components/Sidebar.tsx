'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, Users, UserCog, Gift, Minus,
  Calendar, FileText, Receipt, LogOut, Building2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/employees', icon: Users, label: 'Employees' },
  { href: '/payroll', icon: Calendar, label: 'Payroll' },
  { href: '/salary-slips', icon: Receipt, label: 'Salary Slips' },
  { href: '/allowances', icon: Gift, label: 'Allowances' },
  { href: '/deductions', icon: Minus, label: 'Deductions' },
  { href: '/users', icon: UserCog, label: 'User Management' },
  { href: '/reports', icon: FileText, label: 'Reports' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div
      className="fixed left-0 top-0 bottom-0 w-[260px] flex flex-col z-50 border-r border-white/8"
      style={{ background: 'hsl(var(--sidebar))' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="font-display text-[16px] font-semibold text-white leading-tight">PayrollPro</div>
            <div className="text-[10px] text-white/35 uppercase tracking-widest font-medium">HR Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-0.5">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-2 py-2 mb-1">Navigation</p>
          {navItems.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 group",
                  active
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                    : "text-white/55 hover:text-white/90 hover:bg-white/6"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", active ? "text-amber-400" : "text-white/40 group-hover:text-white/70")} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 text-amber-400/60" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="p-3 border-t border-white/8 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
          <Avatar className="w-8 h-8 rounded-lg">
            <AvatarFallback className="rounded-lg text-[11px] bg-amber-500/25 text-amber-300">
              {user?.UserName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white/85 truncate">{user?.UserName}</div>
            <div className="text-[11px] text-white/35 truncate">{user?.UserType}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
