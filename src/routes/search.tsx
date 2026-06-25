import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — NjangaRent" }] }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // You can pass the query to explore, or implement search locally here.
      // For now, we just redirect to explore which acts as the main feed.
      navigate({ to: "/explore" });
    }
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}>
      {/* Search Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "#FFFFFF",
        borderBottom: "0.5px solid #E8E4DC",
        padding: "12px 16px",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        display: "flex", alignItems: "center", gap: 12
      }}>
        <button
          onClick={() => navigate({ to: "/explore" })}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}
        >
          <ArrowLeft size={22} color="#1A1A18" />
        </button>
        
        <form onSubmit={handleSearch} style={{ flex: 1, display: "flex", alignItems: "center", backgroundColor: "#F9F7F2", borderRadius: 12, padding: "8px 12px", border: "0.5px solid #E8E4DC" }}>
          <SearchIcon size={18} color="#A8A8A5" style={{ marginRight: 8 }} />
          <input
            autoFocus
            type="text"
            placeholder="Search by location, university..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#1A1A18" }}
          />
        </form>
      </div>

      {/* Suggested / Recent Searches */}
      <div style={{ padding: "24px 16px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6B6B68", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Popular areas
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {["Molyko", "Bomaka", "Dirty South", "Muea", "Clarks Quarters"].map(area => (
            <button
              key={area}
              onClick={() => { setQuery(area); setTimeout(() => navigate({ to: "/explore" }), 150); }}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#F9F7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SearchIcon size={18} color="#1B4332" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1A18" }}>{area}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
