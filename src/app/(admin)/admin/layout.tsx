import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect("/dashboard");

  return <AdminShell>{children}</AdminShell>;
}
