import { createFileRoute } from "@tanstack/react-router";
import { InboxShared } from "./_student.student.inbox";

export const Route = createFileRoute("/_landlord/landlord/inbox")({
  head: () => ({ meta: [{ title: "Inbox — NjangaRent" }] }),
  component: () => <InboxShared role="landlord" />,
});
