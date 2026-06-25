import { createFileRoute } from "@tanstack/react-router";
import { VerificationQueue } from "./_admin.admin.verifications.landlords";

export const Route = createFileRoute("/_admin/admin/verifications/students")({
  head: () => ({ meta: [{ title: "Student Verifications — Admin" }] }),
  component: () => <VerificationQueue role="student" />,
});
