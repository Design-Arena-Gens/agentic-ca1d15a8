"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Wallet,
  HeartPulse,
  User2,
} from "lucide-react";
import { clsx } from "clsx";

const items = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Community", href: "/community", icon: Users },
  { label: "Earnings", href: "/earnings", icon: Wallet },
  { label: "Health", href: "/health", icon: HeartPulse },
  { label: "Profile", href: "/profile", icon: User2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur">
      <ul className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2 text-sm font-medium text-slate-500">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition",
                  active
                    ? "text-primary"
                    : "text-slate-500 hover:text-primary-dark",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
