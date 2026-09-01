import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminShell } from "@/components/admin/AdminShell";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth admin><AdminShell>{children}</AdminShell></RequireAuth>;
}
