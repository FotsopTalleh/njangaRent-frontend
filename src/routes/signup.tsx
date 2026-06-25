import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, AlertCircle, Building2, GraduationCap, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { useAuthStore } from "@/store/authStore";
import { AuthShell } from "@/components/layout/AuthShell";
import { axiosClient } from "@/api/axiosClient";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — NjangaRent" },
      { name: "description", content: "Join NjangaRent as a student looking for accommodation or a landlord listing your property in Buea." },
    ],
  }),
  component: SignupPage,
});

type Role = "student" | "landlord";
type Step = 1 | 2;

function SignupPage() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState<Step>(1);
  const [role,    setRole]    = useState<Role>("student");
  const [showPw,  setShowPw]  = useState(false);
  const [pending, setPending] = useState(false);

  // Step 1 — common fields
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [phone,    setPhone]    = useState("");

  // Step 2 — student-specific
  const [matric,   setMatric]   = useState("");
  const [program,  setProgram]  = useState("");
  const [studentIdFiles,   setStudentIdFiles]   = useState<File[]>([]);
  const [admissionFiles,   setAdmissionFiles]   = useState<File[]>([]);

  // Step 2 — landlord-specific
  const [idFrontFiles, setIdFrontFiles] = useState<File[]>([]);
  const [idBackFiles,  setIdBackFiles]  = useState<File[]>([]);
  const [ownerFiles,   setOwnerFiles]   = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);

  const signup = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("role",     role);
      fd.append("fullName", fullName.trim());
      fd.append("email",    email.trim());
      fd.append("password", password);
      if (phone) fd.append("phone", phone.trim());

      if (role === "student") {
        fd.append("university",   "University of Buea");
        fd.append("program",      program.trim());
        fd.append("matricNumber", matric.trim());
        if (studentIdFiles[0]) fd.append("studentIdImage", studentIdFiles[0]);
        if (admissionFiles[0]) fd.append("admissionLetter", admissionFiles[0]);
      } else {
        if (idFrontFiles[0]) fd.append("nationalIdFront", idFrontFiles[0]);
        if (idBackFiles[0])  fd.append("nationalIdBack",  idBackFiles[0]);
        if (ownerFiles[0])   fd.append("ownershipDoc",    ownerFiles[0]);
      }

      const res = await axiosClient.post("/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      setPending(true);
    },
    onError: (err: { message?: string }) => {
      setError(err?.message ?? "Registration failed. Please try again.");
    },
  });

  // Success state
  if (pending) {
    return (
      <AuthShell title="" subtitle="" footer={null}>
        <div className="text-center space-y-4 py-4">
          <CheckCircle2 className="h-14 w-14 text-success mx-auto" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-lg text-foreground">Account created</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Your account is pending admin verification. You will be notified by email once approved, typically within 24–48 hours.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link to="/listings">Browse listings while you wait</Link>
          </Button>
          <Link to="/login" className="block text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  const step1Valid = fullName.trim().length >= 2 && email.includes("@") && password.length >= 8;
  const step2Valid = role === "student"
    ? matric.trim().length >= 2
    : phone.trim().length >= 6;

  return (
    <AuthShell
      title="Create your NjangaRent account"
      subtitle={step === 1 ? "Step 1 of 2 — Basic information" : "Step 2 of 2 — Verification documents"}
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      }
    >
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6" aria-label={`Step ${step} of 2`} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
        <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step === 2 ? "bg-primary" : "bg-border")} />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          {/* Role selector */}
          <div>
            <Label className="mb-2 block">I am a</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["student", "landlord"] as Role[]).map((r) => (
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
                  {r === "student"
                    ? <GraduationCap className="h-6 w-6" aria-hidden="true" />
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

          <Button
            type="button"
            disabled={!step1Valid}
            onClick={() => setStep(2)}
            className="w-full h-11 rounded-xl gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          {role === "student" ? (
            <>
              <Field label="Matriculation number">
                <Input id="signup-matric" className="rounded-xl h-11" placeholder="e.g. FE21A001" value={matric} onChange={(e) => setMatric(e.target.value)} required />
              </Field>
              <Field label="Program of study">
                <Input id="signup-program" className="rounded-xl h-11" placeholder="e.g. Computer Science" value={program} onChange={(e) => setProgram(e.target.value)} />
              </Field>
              <ImageUpload id="signup-student-id" label="Student ID card (optional)" maxFiles={1} onChange={setStudentIdFiles} />
              <ImageUpload id="signup-admission" label="Admission letter (optional)" maxFiles={1} onChange={setAdmissionFiles} />
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
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              type="button"
              disabled={!step2Valid || signup.isPending}
              onClick={() => signup.mutate()}
              className="flex-1 h-11 rounded-xl gap-2"
            >
              {signup.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : null
              }
              {signup.isPending ? "Creating..." : "Create account"}
            </Button>
          </div>
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
