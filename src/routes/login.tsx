import { createFileRoute, Link } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";
import { BrandMark } from "@/components/layout/AppShell";
import { useThemeStore } from "@/store/themeStore";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — NjangaRent" },
      { name: "description", content: "Sign in to manage your rent payments." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="px-4 lg:px-8 h-16 flex items-center">
        <BrandMark />
      </header>

      {/* Centered Clerk SignIn */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md"
        >
          <SignIn
            routing="hash"
            afterSignInUrl="/"
            signUpUrl="/signup"
            appearance={{
              layout: {
                socialButtonsVariant: "blockButton",
                socialButtonsPlacement: "bottom",
                showOptionalFields: false,
              },
              variables: {
                colorPrimary: "#1B4332",
                colorBackground: isDark ? "#0f1f18" : "#ffffff",
                colorText: isDark ? "#e8f5ee" : "#1A1A18",
                colorTextSecondary: isDark ? "#8ab39a" : "#6B6B68",
                colorInputBackground: isDark ? "#162b20" : "#ffffff",
                colorInputText: isDark ? "#e8f5ee" : "#1A1A18",
                colorNeutral: isDark ? "#8ab39a" : "#6B6B68",
                borderRadius: "0.75rem",
                fontFamily: "inherit",
                fontSize: "14px",
                spacingUnit: "1rem",
              },
              elements: {
                // Card styling — matches our AuthShell card look
                card: "shadow-soft border border-border rounded-3xl",
                cardBox: "shadow-none",
                // Header
                headerTitle: "text-2xl font-semibold tracking-tight",
                headerSubtitle: "text-sm text-muted-foreground",
                // Form inputs
                formFieldLabel: "text-sm font-medium",
                formFieldInput:
                  "h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground",
                // Primary button
                formButtonPrimary:
                  "h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors",
                // Divider
                dividerLine: "bg-border",
                dividerText: "text-xs text-muted-foreground uppercase",
                // Social buttons
                socialButtonsBlockButton:
                  "h-11 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-sm font-medium transition-colors",
                // Error
                formFieldErrorText: "text-xs text-destructive",
                alert: "rounded-xl border text-sm",
                // Footer (sign-up link, powered by Clerk)
                footerActionLink: "text-primary font-medium hover:underline",
                footerActionText: "text-sm text-muted-foreground",
                // Forgot password
                formFieldAction: "text-primary text-xs font-medium hover:underline",
              },
            }}
          />
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">← Back to homepage</Link>
      </footer>
    </div>
  );
}
