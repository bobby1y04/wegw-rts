import { AppNavigation } from "@/components/layout/app-navigation";
import { LegalFooter } from "@/components/layout/legal-footer";
import { UserRepository } from "@/server/repositories/user-repository";
import { requireCurrentUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireCurrentUserId();
  await new UserRepository().touch(userId);

  return (
    <div className="min-h-screen">
      <AppNavigation />
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-12">
        {children}
        <LegalFooter />
      </main>
    </div>
  );
}
