"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Rocket, Radar, BarChart3, FolderKanban, Settings,
  RefreshCcw, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/launch", label: "Launch campaign", icon: Rocket },
  { href: "/dashboard/radar", label: "Trend radar", icon: Radar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: FolderKanban },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <RefreshCcw size={16} />
        </div>
        <span className="text-[17px] font-semibold tracking-tight">ClientLoop</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-brand-50 text-brand-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            <Icon size={17} strokeWidth={2.2} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-semibold text-white">
            KM
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">Keith Muoki</p>
            <p className="truncate text-xs text-zinc-500">Life coach · Founder</p>
          </div>
          <LogOut size={15} className="ml-auto text-zinc-400" />
        </div>
      </div>
    </aside>
  );
}
