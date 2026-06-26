// Admin Settings page
import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_admin/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system-wide configuration for NjangaRent.
        </p>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Settings className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium text-sm">Settings panel coming soon</p>
            <p className="text-xs mt-1 max-w-xs">
              Platform-level configuration such as fee rates, maintenance mode, and notification templates will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
