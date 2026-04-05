import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "./AuthModal";
import { GameModeCard } from "./GameModeCard";
import { PartyPanel } from "./PartyPanel";
import { supabase } from "@/integrations/supabase/client";

const GAME_MODES = [
  { id: "sandbox", name: "Sandbox Survival", players: 242, popular: true, color: "#4CAF50", desc: "Build and survive in an open world" },
  { id: "creative", name: "Sandbox Creative", players: 46, color: "#2196F3", desc: "Unlimited building with no limits" },
  { id: "peaceful", name: "Sandbox Peaceful", players: 50, color: "#8BC34A", desc: "Relax and build without threats" },
  { id: "bedwars", name: "Bedwars", players: 273, popular: true, color: "#F44336", desc: "Protect your bed, destroy enemies" },
  { id: "skywars", name: "Skywars", players: 111, color: "#9C27B0", desc: "Fight on floating islands" },
  { id: "1v1", name: "1v1 Fights", players: 346, ranked: true, color: "#FF9800", desc: "Duel other players" },
  { id: "plots", name: "Plots", players: 119, color: "#00BCD4", desc: "Build on your own plot" },
  { id: "oneblock", name: "One Block", players: 11, popular: true, color: "#E91E63", desc: "Expand from a single block" },
  { id: "cubewarfare", name: "Cube Warfare", players: 157, color: "#795548", desc: "FPS combat with blocks" },
  { id: "greenville", name: "Greenville", players: 483, popular: true, color: "#4CAF50", desc: "Roleplay in a virtual city" },
  { id: "laststand", name: "Last Stand", players: 446, color: "#FF5722", desc: "Survive waves of enemies" },
  { id: "murder", name: "Murder Mystery", players: 362, color: "#673AB7", desc: "Find the murderer among you" },
];

const CUSTOM_WORLD_SLOTS = Array.from({ length: 6 }, (_, index) => index + 1);
const CUSTOM_WORLD_PLAYERS = [58, 28, 63, 91, 29, 9];
const FALLBACK_ONLINE_COUNT = 2646;

export function MainMenu({ onPlay }: { onPlay: (mode: string, lobbyId?: string) => void }) {
  const { user, profile, isDev, isSuper, signOut } = useAuth();
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
        setOnlineCount(total || FALLBACK_ONLINE_COUNT);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankBadge = () => {
    if (isDev) return <span className="rounded-sm bg-[#ff160a] px-2 py-0.5 text-[11px] font-black tracking-wide text-white">DEV</span>;
    if (isSuper) return <span className="rounded-sm bg-[#ffc400] px-2 py-0.5 text-[11px] font-black tracking-wide text-black">⚡ SUPER</span>;
    return null;
  };

  return (
    <div className="fixed inset-0 z-20 overflow-auto bg-[#1d3f76]">
      {/* Top bar - bloxd.io style */}
      <div className="flex items-center justify-between border-b border-[#242945] bg-[#151725]/95 px-4 py-2.5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={signOut}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#1e2c44] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#253754]"
              >
                👤 Logout
              </button>
              <span className="text-sm font-black text-white [text-shadow:0_1px_0_rgba(0,0,0,0.35)]">{profile?.username || "Player"}</span>
              {getRankBadge()}
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#1e2c44] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#253754]"
            >
              <span className="text-[#30a3ff]">👤</span> Login
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="text-3xl font-black tracking-tight [text-shadow:0_2px_0_rgba(0,0,0,0.3)]">
            <span className="text-[#32c235]">blocold</span>
            <span className="text-[#d1583f]">.io</span>
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-4">
          <button className="rounded p-1 text-xl text-white/40 transition hover:text-white/75">🎵</button>
          <button className="rounded p-1 text-xl text-white/40 transition hover:text-white/75">🔊</button>
          <button className="rounded p-1 text-xl text-white/40 transition hover:text-white/75">⚙️</button>
          <div className="text-right text-xs text-[#9bb0d6]">
            <div>0</div>
            <div>Requests</div>
          </div>
          <div className="text-right text-xs text-[#9bb0d6]">
            <div>0</div>
            <div>Friends</div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-b border-[#242f55] bg-[#1b2343]/95 px-4 py-2 shadow-[inset_0_-1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <span className="text-[#30a3ff]">👥</span>
          <span>{onlineCount.toLocaleString()}</span>
        </div>
        {!isSuper && (
          <button className="rounded-full bg-[#ffc400] px-4 py-1.5 text-sm font-black text-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] transition hover:brightness-105">
            ⚡ Get Super Rank
          </button>
        )}
        <PartyPanel />
      </div>

      {/* Game mode grid */}
      <div className="mx-auto max-w-[1280px] px-4 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {GAME_MODES.map((mode) => (
            <GameModeCard
              key={mode.id}
              mode={mode}
              playerCount={lobbyCount[mode.id] || mode.players}
              onClick={() => onPlay(mode.id)}
            />
          ))}
        </div>

        {/* Custom Games section */}
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-[20px] font-black tracking-[0.01em] text-white [text-shadow:0_1px_0_rgba(0,0,0,0.45)]">
            Custom Games <span className="text-[#92a8d4]">→</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {CUSTOM_WORLD_SLOTS.map((i) => (
              <button
                key={i}
                type="button"
                className="group overflow-hidden rounded-2xl border border-[#314f86] bg-[#25313f] text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#4d6ea8]"
                onClick={() => onPlay("sandbox")}
              >
                <div className="aspect-video bg-[#2b333f]" />
                <div className="border-t border-white/4 bg-[#162f53] p-2">
                  <p className="text-[13px] font-medium text-white">Custom World {i}</p>
                  <p className="text-[11px] font-semibold text-[#2aa6ff]">👥 {CUSTOM_WORLD_PLAYERS[i - 1]}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
