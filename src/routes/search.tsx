import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon, ArrowLeft, MapPin } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — NjangaRent" }] }),
  component: SearchPage,
});

const POPULAR_AREAS = ["Molyko", "Bomaka", "Dirty South", "Muea", "Clarks Quarters", "Bokova"];

function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/explore" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 pt-[max(12px,env(safe-area-inset-top))] flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/explore" })}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>

        <form onSubmit={handleSearch} className="flex-1 flex items-center bg-muted rounded-xl px-3 py-2 gap-2 border border-border">
          <SearchIcon size={16} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search by location, university..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </form>
      </div>

      {/* Suggested Areas */}
      <div className="px-4 pt-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Popular areas
        </h3>
        <div className="flex flex-col gap-0 divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
          {POPULAR_AREAS.map(area => (
            <button
              key={area}
              onClick={() => navigate({ to: "/explore" })}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{area}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
