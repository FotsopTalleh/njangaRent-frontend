// Admin Messages Audit — messages table not yet in Supabase; shows placeholder.
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_admin/admin/messages")({
  head: () => ({ meta: [{ title: "Messages Audit — Admin" }] }),
  component: AdminMessages,
});

function AdminMessages() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Messages Audit</h1>
        <p className="text-sm text-muted-foreground mt-1">Review all platform conversations.</p>
      </div>
      <Card className="rounded-2xl border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Conversation Threads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium text-sm">Messages audit not yet available</p>
            <p className="text-xs mt-1 max-w-xs">
              Platform message threads will appear here once the <code>threads</code> table is migrated to Supabase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
