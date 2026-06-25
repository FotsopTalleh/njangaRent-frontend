import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_student")({
  component: () => (
    <RoleGate role={["student", "tenant"]}>
      <AppShell variant="student">
        <Outlet />
      </AppShell>
    </RoleGate>
  ),
});
