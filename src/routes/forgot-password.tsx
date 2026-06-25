import { SignIn } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordComponent,
});

function ForgotPasswordComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      {/* Clerk handles forgot password inside the SignIn component natively */}
      <SignIn routing="path" path="/login" signUpUrl="/signup" />
    </div>
  );
}
