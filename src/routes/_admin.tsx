import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_admin")({
  component: () => (
    <RoleGate role="admin">
      <AppShell variant="admin">
        <Outlet />
      </AppShell>
    </RoleGate>
  ),
});
