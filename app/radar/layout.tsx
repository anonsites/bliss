import { getAuthenticatedUser } from "@/features/auth/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    redirect("/");
  }

  if (!authenticatedUser.profileCompletedAt) {
    redirect("/checkpoint");
  }

  return <AppShell activeTab="Radar">{children}</AppShell>;
}
