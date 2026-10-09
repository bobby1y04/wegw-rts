import { AppNavigation } from "@/components/layout/app-navigation";

export const dynamic = "force-dynamic";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppNavigation />
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-12">
        {children}
      </main>
    </div>
  );
}
