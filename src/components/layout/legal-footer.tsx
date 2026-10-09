import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)]">
      <span>Öffentliche Demo · ab 16 Jahren</span>
      <Link href="/datenschutz" className="hover:text-[var(--primary)]">
        Datenschutz
      </Link>
      <Link href="/impressum" className="hover:text-[var(--primary)]">
        Impressum
      </Link>
    </footer>
  );
}
