import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth.schemas";
import { AuthShell } from "@/components/layout/AuthShell";
import { useSignIn, useUser, useAuth } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { useAuthStore, dashboardForRole } from "@/store/authStore";

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
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const { userId } = useAuth();
  const storedUser = useAuthStore((s) => s.user);
  const [showPw, setShowPw] = useState(false);

  // Guard: already signed in → go to dashboard
  useEffect(() => {
    if (userLoaded && isSignedIn && storedUser) {
      navigate({ to: dashboardForRole(storedUser.role), replace: true });
    }
  }, [userLoaded, isSignedIn, storedUser, navigate]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: async (v: LoginInput) => {
      if (!isLoaded) throw new Error("Authentication service is loading...");
      
      const result = await signIn.create({
        identifier: v.email,
        password: v.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        return result;
      } else {
        throw new Error("Additional verification steps required.");
      }
    },
    onSuccess: () => {
      // Navigate directly to the dashboard based on role from Clerk metadata
      // This avoids the double-redirect through AuthSync on the home page
      const role = (signIn?.userData as any)?.unsafeMetadata?.role ||
                   storedUser?.role ||
                   "student";
      navigate({ to: dashboardForRole(role as any), replace: true });
    },
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={form.handleSubmit((v) => login.mutate(v))} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className={cn(form.formState.errors.email && "text-destructive")}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={cn("rounded-xl h-11", form.formState.errors.email && "border-destructive focus-visible:ring-destructive")}
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
             <p className="flex items-center gap-1 text-xs text-destructive">
               <AlertCircle className="h-3 w-3 shrink-0" />
               {form.formState.errors.email.message}
             </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={cn(form.formState.errors.password && "text-destructive")}>
              Password
            </Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn("rounded-xl h-11 pr-10", form.formState.errors.password && "border-destructive focus-visible:ring-destructive")}
              aria-invalid={!!form.formState.errors.password}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {login.isError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{(login.error as { message?: string })?.message || "Sign in failed"}</span>
          </motion.div>
        )}

        <Button type="submit" disabled={login.isPending || !isLoaded} className="w-full h-11 rounded-xl">
          {login.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Sign in
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            disabled={!isLoaded}
            onClick={() => signIn?.authenticateWithRedirect({ strategy: "oauth_google", redirectUrl: "/sso-callback", redirectUrlComplete: "/" })}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            disabled={!isLoaded}
            onClick={() => signIn?.authenticateWithRedirect({ strategy: "oauth_apple", redirectUrl: "/sso-callback", redirectUrlComplete: "/" })}
          >
            <svg className="w-5 h-5 mr-2 text-foreground fill-current" viewBox="0 0 24 24">
              <path d="M16.365 14.502c-.015-2.477 2.02-3.66 2.112-3.717-1.15-1.684-2.936-1.91-3.567-1.93-1.503-.153-2.946 1.056-3.718 1.056-.773 0-1.956-1.036-3.203-1.008-1.616.033-3.116.94-3.948 2.39-1.683 2.92-4.302 8.272-2.564 11.286.843 1.458 1.848 3.1 3.435 3.042 1.528-.061 2.106-.99 3.953-.99 1.845 0 2.366.99 3.98.96 1.67-.03 2.518-1.488 3.353-2.933 1.053-1.543 1.486-3.042 1.505-3.12-.034-.012-2.924-1.12-2.946-4.22h-.002z" />
              <path d="M14.67 4.298c.844-1.022 1.413-2.443 1.258-3.863-1.21.05-2.68.808-3.548 1.85-.776.924-1.464 2.37-1.275 3.76 1.353.105 2.72-.703 3.565-1.747v.002z" />
            </svg>
            Apple
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
