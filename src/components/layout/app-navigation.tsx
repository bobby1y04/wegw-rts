"use client";

import {
  Compass,
  Home,
  Map,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Heute", icon: Home },
  { href: "/weg", label: "Mein Weg", icon: Map },
  { href: "/mentor", label: "Mentor", icon: MessageCircle },
  { href: "/chancen", label: "Chancen", icon: Sparkles },
  { href: "/profil", label: "Profil", icon: UserRound },
];

function NavItems({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return items.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl font-medium transition-colors",
          mobile ? "min-w-16 flex-col px-2 py-2 text-[0.7rem]" : "px-3 py-2.5 text-sm",
          active
            ? "bg-[var(--secondary)] text-[var(--primary-strong)]"
            : "text-[var(--muted-foreground)] hover:bg-white hover:text-[var(--foreground)]",
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
        <span>{label}</span>
      </Link>
    );
  });
}

export function AppNavigation() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-[var(--border)] bg-[#f4f1e9]/95 p-5 backdrop-blur lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--primary)] text-white">
            <Compass className="size-5" aria-hidden />
          </span>
          <span>
            <strong className="block text-lg tracking-tight">Wegwärts</strong>
            <span className="text-xs text-[var(--muted-foreground)]">
              Dein Bildungsnavigator
            </span>
          </span>
        </Link>
        <nav className="space-y-1" aria-label="Hauptnavigation">
          <NavItems />
        </nav>
        <p className="mt-auto px-2 text-xs leading-5 text-[var(--muted-foreground)]">
          Dein Weg. Dein Tempo.
          <br />
          Nicht allein.
        </p>
      </aside>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--border)] bg-[#faf8f2]/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Mobile Hauptnavigation"
      >
        <NavItems mobile />
      </nav>
    </>
  );
}
