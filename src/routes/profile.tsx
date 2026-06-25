import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import { User, ChevronRight, FileText, Star, LogOut, Bell, Moon, Sun, Shield, Phone, Mail } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — NjangaRent" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    logout();
    navigate({ to: "/" });
  };

  const role = user?.role || "tenant";
  const isVerified = clerkUser?.publicMetadata?.verified === true;

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header avatar card */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-4 pt-8 pb-6">
        <div className="flex items-center gap-4">
          {clerkUser?.imageUrl ? (
            <img
              src={clerkUser.imageUrl}
              alt={user?.name || ""}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold uppercase">
              {(user?.name || "U")[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{user?.name || "User"}</h1>
            <p className="text-sm text-muted-foreground capitalize">{role}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                isVerified
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              )}>
                <Shield className="h-2.5 w-2.5" />
                {isVerified ? "Verified" : "Pending Verification"}
              </span>
            </div>
          </div>
        </div>

        {/* Contact info pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {user?.email && (
            <div className="flex items-center gap-1.5 bg-background/60 rounded-full px-3 py-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[160px]">{user.email}</span>
            </div>
          )}
          {typeof clerkUser?.unsafeMetadata?.phone === "string" && (
            <div className="flex items-center gap-1.5 bg-background/60 rounded-full px-3 py-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{clerkUser.unsafeMetadata.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-4 py-4 space-y-4">
        {/* Account section */}
        <MenuSection title="Account">
          <MenuItem
            icon={FileText}
            label="My Documents"
            subtitle="ID, ownership proof"
            to="/profile/documents"
          />
          <MenuItem
            icon={Star}
            label="Reviews"
            subtitle="Ratings given & received"
            to="/profile/reviews"
          />
          {role === "landlord" && (
            <MenuItem
              icon={Bell}
              label="Notifications"
              to="/notifications"
            />
          )}
        </MenuSection>

        {/* Appearance */}
        <MenuSection title="Preferences">
          <li className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              </div>
              <span className="text-sm font-medium">Dark mode</span>
            </div>
            <button
              onClick={toggle}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200",
                theme === "dark" ? "bg-primary" : "bg-muted"
              )}
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Toggle dark mode"
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                theme === "dark" ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </li>
        </MenuSection>

        {/* Sign out */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl text-destructive border-destructive/30 hover:bg-destructive/5 gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 pb-2">NjangaRent v2.0 · Buea, Cameroon</p>
      </div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">{title}</p>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <ul className="divide-y divide-border">
          {children}
        </ul>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon, label, subtitle, to,
}: {
  icon: React.ElementType; label: string; subtitle?: string; to: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors min-h-[56px]"
      >
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
      </Link>
    </li>
  );
}
