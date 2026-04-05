import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "./AuthModal";
import { GameModeCard } from "./GameModeCard";
import { PartyPanel } from "./PartyPanel";
import { supabase } from "@/integrations/supabase/client";

const GAME_MODES = [
  { id: "sandbox", name: "Sandbox Survival", players: 0, popular: true, color: "#4CAF50", desc: "Build and survive in an open world" },
  { id: "creative", name: "Sandbox Creative", players: 0, color: "#2196F3", desc: "Unlimited building with no limits" },
  { id: "peaceful", name: "Sandbox Peaceful", players: 0, color: "#8BC34A", desc: "Relax and build without threats" },
  { id: "bedwars", name: "Bedwars", players: 0, popular: true, color: "#F44336", desc: "Protect your bed, destroy enemies" },
  { id: "skywars", name: "Skywars", players: 0, color: "#9C27B0", desc: "Fight on floating islands" },
  { id: "1v1", name: "1v1 Fights", players: 0, ranked: true, color: "#FF9800", desc: "Duel other players" },
  { id: "plots", name: "Plots", players: 0, color: "#00BCD4", desc: "Build on your own plot" },
  { id: "oneblock", name: "One Block", players: 0, popular: true, color: "#E91E63", desc: "Expand from a single block" },
  { id: "cubewarfare", name: "Cube Warfare", players: 0, color: "#795548", desc: "FPS combat with blocks" },
  { id: "greenville", name: "Greenville", players: 0, popular: true, color: "#4CAF50", desc: "Roleplay in a virtual city" },
  { id: "laststand", name: "Last Stand", players: 0, color: "#FF5722", desc: "Survive waves of enemies" },
  { id: "murder", name: "Murder Mystery", players: 0, color: "#673AB7", desc: "Find the murderer among you" },
];

export function MainMenu({ onPlay }: { onPlay: (mode: string, lobbyId?: string) => void }) {
  const { user, profile, isDev, isSuper, signOut, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lobbyCount, setLobbyCount] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch lobby counts by game mode
    supabase
      .from("lobbies")
      .select("game_mode, current_players")
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        let total = 0;
        data.forEach((l) => {
          counts[l.game_mode] = (counts[l.game_mode] || 0) + l.current_players;
          total += l.current_players;
        });
        setLobbyCount(counts);
        setOnlineCount(total || Math.floor(Math.random() * 5000) + 1000);
      });

    // Subscribe to lobby changes
    const channel = supabase
      .channel("lobby-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "lobbies" }, () => {
        supabase.from("lobbies").select("game_mode, current_players").then(({ data }) => {
          if (!data) return;
          const counts: Record<string, number> = {};
          data.forEach((l) => {
            counts[l.game_mode] = (counts[l.game_mode] || 0) + l.current_players;
          });
          setLobbyCount(counts);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getRankBadge = () => {
    if (isDev) return <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">DEV</span>;
    if (isSuper) return <span className="rounded bg-yellow-500 px-2 py-0.5 text-xs font-bold text-black">⚡ SUPER</span>;
    return null;
  };

  return (
    <div className="fixed inset-0 z-20 overflow-auto" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      {/* Top bar - bloxd.io style */}
      <div className="flex items-center justify-between border-b border-border/30 bg-black/40 px-4 py-2">
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={signOut}
                className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                👤 Logout
              </button>
              <span className="font-bold text-foreground">{profile?.username || "Player"}</span>
              {getRankBadge()}
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              👤 Login
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="text-3xl font-black tracking-tight text-foreground">
            <span className="text-primary">blocold</span>
            <span className="text-accent">.io</span>
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-3">
          <button className="rounded p-2 text-foreground/60 transition hover:bg-secondary/50 hover:text-foreground">🎵</button>
          <button className="rounded p-2 text-foreground/60 transition hover:bg-secondary/50 hover:text-foreground">🔊</button>
          <button className="rounded p-2 text-foreground/60 transition hover:bg-secondary/50 hover:text-foreground">⚙️</button>
          <div className="text-right text-xs text-muted-foreground">
            <div>0</div>
            <div>Requests</div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>0</div>
            <div>Friends</div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-center gap-4 border-b border-border/20 bg-black/20 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>👥</span>
          <span className="font-bold text-foreground">{onlineCount.toLocaleString()}</span>
        </div>
        {!isSuper && (
          <button className="rounded-full bg-yellow-500 px-4 py-1.5 text-sm font-bold text-black transition hover:bg-yellow-400">
            ⚡ Get Super Rank
          </button>
        )}
        <PartyPanel />
      </div>

      {/* Game mode grid */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {GAME_MODES.map((mode) => (
            <GameModeCard
              key={mode.id}
              mode={mode}
              playerCount={lobbyCount[mode.id] || Math.floor(Math.random() * 500)}
              onClick={() => onPlay(mode.id)}
            />
          ))}
        </div>

        {/* Custom Games section */}
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            Custom Games <span className="text-muted-foreground">→</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="group cursor-pointer overflow-hidden rounded-lg border border-border/30 bg-card/50 transition hover:border-primary/50 hover:bg-card"
                onClick={() => onPlay("sandbox")}
              >
                <div className="aspect-video bg-gradient-to-br from-secondary to-muted" />
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground">Custom World {i}</p>
                  <p className="text-[10px] text-muted-foreground">👥 {Math.floor(Math.random() * 100)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
