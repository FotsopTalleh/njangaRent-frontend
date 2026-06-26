// Student Receipts — placeholder (no receipts table yet)
import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_student/student/receipts")({
  head: () => ({ meta: [{ title: "Receipts — NjangaRent" }] }),
  component: StudentReceipts,
});

function StudentReceipts() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Receipts</h1>
        <p className="text-sm text-muted-foreground mt-1">Your payment receipts will appear here.</p>
      </div>
      <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No receipts yet</p>
        <p className="text-xs mt-1">Receipts are generated after confirmed payments.</p>
      </div>
    </div>
  );
}
