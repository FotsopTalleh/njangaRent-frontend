import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Building2, CheckCircle2, MessageSquare, ShieldCheck,
  MapPin, Search, Calendar, CreditCard, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NjangaRent — Student housing, made simple — Buea, Cameroon" },
      { name: "description", content: "Find verified student accommodation near the University of Buea. Browse listings, message landlords, and pay via Nkwa Mobile Money." },
      { property: "og:title", content: "NjangaRent — Student housing, made simple" },
      { property: "og:description", content: "Verified rooms near UB. Message landlords, book viewings, pay via Nkwa." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandMark />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <Link to="/listings" className="hover:text-foreground transition-colors">Browse rooms</Link>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-background">
            <a href="#features" onClick={() => setOpen(false)} className="block text-sm hover:text-primary transition-colors">Features</a>
            <a href="#how" onClick={() => setOpen(false)} className="block text-sm hover:text-primary transition-colors">How it works</a>
            <Link to="/listings" onClick={() => setOpen(false)} className="block text-sm hover:text-primary transition-colors">Browse rooms</Link>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1 rounded-xl">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="flex-1 rounded-xl">
                <Link to="/signup">Get started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Built for UB students
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.06]">
              Student housing,<br />
              <span className="text-primary">made simple.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Find verified accommodation near the University of Buea. Message landlords directly, book viewings, and pay rent via Nkwa Mobile Money.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl gap-2">
                <Link to="/listings">
                  Browse rooms
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/signup">List your property</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Verified landlords
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Near UB campus
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Pay via Nkwa MoMo
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <HeroMockup />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything students need to find a room
          </h2>
          <p className="mt-3 text-muted-foreground">
            From browsing to moving in — NjangaRent handles it all.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card shadow-soft hover:shadow-elevated transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">Secure accommodation in three simple steps.</p>
          </div>
          <ol className="mt-12 grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed ml-12">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What students say</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure key={t.name} className="p-6 rounded-2xl border border-border bg-card">
              <blockquote className="text-sm leading-relaxed text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold shrink-0" aria-hidden="true">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.location}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 pb-20">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 lg:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-elevated">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Ready to find your room?
            </h2>
            <p className="mt-2 text-primary-foreground/80 max-w-xl">
              Join hundreds of UB students finding comfortable, verified accommodation through NjangaRent.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button asChild size="lg" variant="secondary" className="rounded-xl gap-2">
              <Link to="/listings">
                Browse rooms
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" className="rounded-xl bg-white/15 hover:bg-white/25 text-white border-white/20 border">
              <Link to="/signup">List your property</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div>
            <BrandMark />
            <p className="mt-3 text-muted-foreground">Student housing, made simple — Buea, Cameroon.</p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Students</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/listings" className="hover:text-foreground transition-colors">Browse rooms</Link></li>
              <li><Link to="/signup" className="hover:text-foreground transition-colors">Create account</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Landlords</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/signup" className="hover:text-foreground transition-colors">List property</Link></li>
              <li><a href="#how" className="hover:text-foreground transition-colors">How it works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Install</h4>
            <p className="text-muted-foreground">Add NjangaRent to your home screen for instant access — works offline.</p>
          </div>
        </div>
        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} NjangaRent. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const features = [
  { title: "Verified listings",       desc: "Every landlord and listing is reviewed by the NjangaRent team before going live.",               icon: ShieldCheck   },
  { title: "Browse near UB",          desc: "Filter by distance from UB Main Gate, price, room type, and amenities.",                         icon: Search        },
  { title: "Real-time messaging",     desc: "Chat directly with landlords inside the app — no need to exchange phone numbers.",                icon: MessageSquare },
  { title: "Book viewings",           desc: "Request a viewing slot and get confirmation from the landlord, all within NjangaRent.",          icon: Calendar      },
  { title: "Nkwa Mobile Money",       desc: "Pay your deposit or rent directly via MTN or Orange MoMo — no cash required.",                   icon: CreditCard    },
  { title: "Buea neighbourhood map",  desc: "See exactly where each room is relative to UB, Molyko market, and key areas.",                   icon: MapPin        },
];

const steps = [
  { title: "Browse & filter",    desc: "Search rooms by type, distance from UB, price, and amenities. Every listing shows real photos." },
  { title: "Message & book",     desc: "Chat with landlords and book a viewing slot directly through the app." },
  { title: "Move in & pay",      desc: "Pay your deposit and monthly rent via Nkwa MoMo — tracked and receipted automatically." },
];

const testimonials = [
  { quote: "Found my room in Molyko in two days. The map showing distance from UB was super useful.", name: "Divine N.", location: "Computer Science, UB" },
  { quote: "I could chat with the landlord before even visiting. Much safer than Facebook groups.", name: "Precilia A.", location: "Law, UB" },
  { quote: "Listed my property and had 5 inquiries in the first week. The admin verification builds trust.", name: "Mr. Mbah", location: "Landlord, Molyko" },
];

function HeroMockup() {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-border bg-card shadow-elevated overflow-hidden">
        {/* Browser chrome */}
        <div className="h-10 bg-muted/60 border-b border-border flex items-center gap-2 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/50" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/50" aria-hidden="true" />
          <div className="flex-1 mx-4 rounded-full bg-muted h-5 text-[10px] text-muted-foreground flex items-center px-3">
            njangrent.cm/listings
          </div>
        </div>
        <div className="p-5 space-y-3">
          {/* Listing cards mock */}
          {[
            { title: "Self-contained near UB Gate", price: "35,000 XAF/mo", dist: "0.3 km" },
            { title: "Studio — Molyko main road",   price: "22,000 XAF/mo", dist: "0.8 km" },
            { title: "Single room — Bonduma",        price: "15,000 XAF/mo", dist: "1.4 km" },
          ].map((l) => (
            <div key={l.title} className="flex gap-3 rounded-xl border border-border bg-card p-3 items-center">
              <div className="h-14 w-20 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold line-clamp-1">{l.title}</p>
                <p className="text-xs text-primary font-bold mt-0.5">{l.price}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
                  {l.dist} from UB
                </div>
              </div>
              <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-3 w-3 text-success" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Floating distance badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute -bottom-4 -left-4 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-elevated"
      >
        <p className="text-xs font-semibold">0.3 km from UB</p>
        <p className="text-[10px] text-muted-foreground">5 min walk</p>
      </motion.div>
    </div>
  );
}
