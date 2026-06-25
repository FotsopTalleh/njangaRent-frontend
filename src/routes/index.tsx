import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuthStore, dashboardForRole } from "@/store/authStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NjangaRent — Find your home in Buea, Cameroon" },
      { name: "description", content: "Browse verified rooms, studios, and apartments across Buea — Molyko, Bonduma, Great Soppo, Buea Town and more. Message landlords, book viewings, and pay rent via Mobile Money." },
    ],
  }),
  component: OnboardingScreen,
} as any);

function OnboardingScreen() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const storedUser = useAuthStore((s) => s.user);

  // Guard: already authenticated → jump straight to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && storedUser) {
      navigate({ to: dashboardForRole(storedUser.role), replace: true });
    }
  }, [isLoaded, isSignedIn, storedUser, navigate]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(175deg, #102A1F 0%, #1B4332 35%, #2D6A4F 60%, #183C2D 100%)",
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(45,106,79,0.3) 0%, transparent 70%)",
        }}
      />

      {/* Centered content card — constrains to mobile width even on desktop */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 py-12 flex flex-col items-center text-center min-h-screen sm:min-h-0 sm:py-16 justify-center">

        {/* App icon */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <div
            className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #ea8c00 100%)",
              boxShadow: "0 8px 24px rgba(245,158,11,0.35)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L3 9v12h6v-7h6v7h6V9l-9-7z" fill="white" fillOpacity="0.95" />
            </svg>
          </div>
        </motion.div>

        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-display"
        >
          NjangaRent
        </motion.h1>

        {/* House illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 mb-8 relative"
        >
          <HouseIllustration />
          {/* Location pin */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="absolute -top-2 right-4"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #ea8c00 100%)",
                boxShadow: "0 4px 12px rgba(245,158,11,0.4)",
              }}
            >
              <MapPin className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-lg text-green-50/80 leading-relaxed max-w-[280px]"
        >
          Find your perfect home in Buea and across Cameroon
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-10 w-full"
        >
          <Link
            to="/login"
            className="block w-full py-4 rounded-2xl text-center font-semibold text-[15px] transition-all duration-200 active:scale-[0.98]"
            style={{
              background: "white",
              color: "#1B4332",
              boxShadow: "0 4px 16px rgba(255,255,255,0.15)",
            }}
          >
            Get Started
          </Link>
        </motion.div>

        {/* Terms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-8 text-xs text-green-100/40"
        >
          By continuing, you agree to our{" "}
          <span className="underline underline-offset-2 cursor-pointer">Terms</span> &amp;{" "}
          <span className="underline underline-offset-2 cursor-pointer">Privacy Policy</span>
        </motion.p>
      </div>
    </div>
  );
}

function HouseIllustration() {
  return (
    <svg
      width="220"
      height="160"
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Roof */}
      <path
        d="M30 80 L110 25 L190 80"
        stroke="rgba(167,243,208,0.6)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* House body */}
      <rect
        x="45"
        y="80"
        width="130"
        height="70"
        rx="6"
        fill="rgba(16,185,129,0.12)"
        stroke="rgba(16,185,129,0.25)"
        strokeWidth="1.5"
      />
      {/* Window left */}
      <rect
        x="60"
        y="95"
        width="30"
        height="25"
        rx="4"
        fill="rgba(52,211,153,0.15)"
        stroke="rgba(52,211,153,0.25)"
        strokeWidth="1"
      />
      {/* Door / center window */}
      <rect
        x="100"
        y="92"
        width="28"
        height="30"
        rx="4"
        fill="rgba(16,185,129,0.2)"
        stroke="rgba(16,185,129,0.3)"
        strokeWidth="1"
      />
      {/* Window right */}
      <rect
        x="138"
        y="95"
        width="25"
        height="25"
        rx="4"
        fill="rgba(52,211,153,0.15)"
        stroke="rgba(52,211,153,0.25)"
        strokeWidth="1"
      />
    </svg>
  );
}
