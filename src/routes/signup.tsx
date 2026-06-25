import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Building2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { AuthShell } from "@/components/layout/AuthShell";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { dashboardForRole } from "@/store/authStore";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — NjangaRent" },
      { name: "description", content: "Join NjangaRent as a tenant looking for accommodation or a landlord listing your property in Buea." },
    ],
  }),
  component: SignupPage,
});

type Role = "tenant" | "landlord";
type Step = 1 | 2 | 3;

function SignupPage() {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>("tenant");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1 — common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 — landlord-specific
  const [idFrontFiles, setIdFrontFiles] = useState<File[]>([]);
  const [idBackFiles, setIdBackFiles] = useState<File[]>([]);
  const [ownerFiles, setOwnerFiles] = useState<File[]>([]);

  // Step 3 — verification code
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);

  // If user is already signed in, redirect to their dashboard
  useEffect(() => {
    if (isSignedIn) {
      // Default to tenant dashboard; AuthSync will update once role is read from Clerk
      navigate({ to: dashboardForRole(role as any), replace: true });
    }
  }, [isSignedIn, navigate, role]);

  const handleCreateAccount = async () => {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError(null);

    try {
      const nameParts = fullName.trim().split(" ");
      const generatedUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + Math.floor(Math.random() * 10000);
      
      await signUp.create({
        emailAddress: email.trim(),
        username: generatedUsername,
        password,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
        unsafeMetadata: {
          role,
          phone: phone.trim(),
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep(3);
    } catch (err: any) {
      console.error("Signup create error:", err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // Navigate directly to the role-based dashboard — no round-trip through /
        navigate({ to: dashboardForRole(role as any), replace: true });
      } else if (result.status === "missing_requirements" && result.missingFields?.includes("username")) {
        // If they are stuck here from a previous attempt, auto-fix it
        const fallbackUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + Math.floor(Math.random() * 10000);
        const updated = await signUp.update({ username: fallbackUsername });
        if (updated.status === "complete") {
          await setActive({ session: updated.createdSessionId });
          navigate({ to: dashboardForRole(role as any), replace: true });
        } else {
          setError(`Signup incomplete (status: ${updated.status}). Please try again.`);
        }
      } else {
        const missing = result.missingFields?.join(", ") || "Unknown";
        setError(`Signup incomplete (missing: ${missing}). Please try again.`);
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Verification failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const step1Valid = fullName.trim().length >= 2 && email.includes("@") && password.length >= 8;
  const step2Valid = phone.trim().length >= 6;

  return (
    <AuthShell
      title="Create your NjangaRent account"
      subtitle={step === 1 ? "Step 1 of 3 — Basic information" : step === 2 ? "Step 2 of 3 — Verification documents" : "Step 3 of 3 — Verify your email"}
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      }
    >
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6" aria-label={`Step ${step} of 3`} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
        <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-border")} />
        <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step === 3 ? "bg-primary" : "bg-border")} />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          {/* Role selector */}
          <div>
            <Label className="mb-2 block">I am a</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["tenant", "landlord"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 py-4 transition-all text-sm font-medium",
                    role === r
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {r === "tenant"
                    ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    : <Building2 className="h-6 w-6" aria-hidden="true" />
                  }
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Full name">
            <Input id="signup-name" autoComplete="name" className="rounded-xl h-11" placeholder="e.g. John Fon" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>

          <Field label="Email address">
            <Input id="signup-email" type="email" autoComplete="email" className="rounded-xl h-11" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>

          <Field label="Password">
            <div className="relative">
              <Input
                id="signup-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className="rounded-xl h-11 pr-10"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </Field>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            disabled={!step1Valid}
            onClick={() => { setError(null); setStep(2); }}
            className="w-full h-11 rounded-xl gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          {role === "tenant" && (
            <>
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
                  onClick={() => signUp?.authenticateWithRedirect({ strategy: "oauth_google", redirectUrl: "/sso-callback", redirectUrlComplete: "/" })}
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
                  onClick={() => signUp?.authenticateWithRedirect({ strategy: "oauth_apple", redirectUrl: "/sso-callback", redirectUrlComplete: "/" })}
                >
                  <svg className="w-5 h-5 mr-2 text-foreground fill-current" viewBox="0 0 24 24">
                    <path d="M16.365 14.502c-.015-2.477 2.02-3.66 2.112-3.717-1.15-1.684-2.936-1.91-3.567-1.93-1.503-.153-2.946 1.056-3.718 1.056-.773 0-1.956-1.036-3.203-1.008-1.616.033-3.116.94-3.948 2.39-1.683 2.92-4.302 8.272-2.564 11.286.843 1.458 1.848 3.1 3.435 3.042 1.528-.061 2.106-.99 3.953-.99 1.845 0 2.366.99 3.98.96 1.67-.03 2.518-1.488 3.353-2.933 1.053-1.543 1.486-3.042 1.505-3.12-.034-.012-2.924-1.12-2.946-4.22h-.002z" />
                    <path d="M14.67 4.298c.844-1.022 1.413-2.443 1.258-3.863-1.21.05-2.68.808-3.548 1.85-.776.924-1.464 2.37-1.275 3.76 1.353.105 2.72-.703 3.565-1.747v.002z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          {role === "tenant" ? (
            <>
              <Field label="Phone number">
                <Input id="signup-phone" type="tel" className="rounded-xl h-11" placeholder="+237 677 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </Field>
              <ImageUpload id="signup-id-front" label="National ID — front (optional)" maxFiles={1} onChange={setIdFrontFiles} />
              <ImageUpload id="signup-id-back" label="National ID — back (optional)" maxFiles={1} onChange={setIdBackFiles} />
            </>
          ) : (
            <>
              <Field label="Phone number" hint="Required for landlords">
                <Input id="signup-phone" type="tel" className="rounded-xl h-11" placeholder="+237 677 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </Field>
              <ImageUpload id="signup-id-front" label="National ID — front (optional)" maxFiles={1} onChange={setIdFrontFiles} />
              <ImageUpload id="signup-id-back" label="National ID — back (optional)" maxFiles={1} onChange={setIdBackFiles} />
              <ImageUpload id="signup-ownership" label="Property ownership document (optional)" maxFiles={1} onChange={setOwnerFiles} />
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2" role="alert" aria-live="polite">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => { setError(null); setStep(1); }} className="flex-1 h-11 rounded-xl gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              type="button"
              disabled={!step2Valid || loading}
              onClick={handleCreateAccount}
              className="flex-1 h-11 rounded-xl gap-2"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : null
              }
              {loading ? "Creating..." : "Create account"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 text-center">
          <div className="bg-primary/10 text-primary p-4 rounded-xl mb-4">
            <p className="text-sm font-medium">We've sent a verification code to</p>
            <p className="font-bold">{email}</p>
          </div>

          <Field label="Enter verification code">
            <Input
              id="signup-code"
              className="rounded-xl h-11 text-center text-lg tracking-widest"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2 text-left" role="alert" aria-live="polite">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            disabled={code.length < 6 || loading}
            onClick={handleVerify}
            className="w-full h-11 rounded-xl gap-2"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : null
            }
            {loading ? "Verifying..." : "Verify & Sign In"}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{hint && <span className="ml-1 text-xs text-muted-foreground">({hint})</span>}</Label>
      {children}
    </div>
  );
}
