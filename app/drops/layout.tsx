import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth/server";
import { AppShell } from "@/components/layout";

export default async function DropsLayout({
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

  return <AppShell activeTab="Drops">{children}</AppShell>;
}
