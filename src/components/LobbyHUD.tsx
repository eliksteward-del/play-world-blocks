import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CodeEditor } from "./CodeEditor";

interface LobbyHUDProps {
  gameMode: string;
  lobbyId: string;
  onLeave: () => void;
}

export function LobbyHUD({ gameMode, lobbyId, onLeave }: LobbyHUDProps) {
  const { profile, isDev, isSuper } = useAuth();
  const [showCode, setShowCode] = useState(false);

  const getRankColor = () => {
    if (isDev) return "text-red-400";
    if (isSuper) return "text-yellow-400";
    return "text-foreground";
  };

  return (
    <>
      {/* Top-left: Game mode & player info */}
      <div className="pointer-events-auto absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="rounded-xl border border-white/8 bg-[#111728]/85 px-3 py-1.5 text-xs text-white/85 shadow-[0_10px_30px_rgba(4,8,20,0.28)] backdrop-blur-sm">
          <span className="text-white/55">Mode: </span>
          <span className="font-black uppercase">{gameMode}</span>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111728]/85 px-3 py-1.5 text-xs text-white/85 shadow-[0_10px_30px_rgba(4,8,20,0.28)] backdrop-blur-sm">
          <span className={`font-black ${getRankColor()}`}>
            {isDev && "🔧 DEV "}
            {isSuper && !isDev && "⚡ SUPER "}
            {profile?.username || "Player"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCode(true)}
            className="pointer-events-auto rounded-xl border border-white/8 bg-[#f39b1d] px-3 py-1.5 text-xs font-black text-[#1d1400] transition hover:brightness-105"
          >
            📝 Code
          </button>
          <button
            onClick={onLeave}
            className="pointer-events-auto rounded-xl border border-white/8 bg-[#c3453a] px-3 py-1.5 text-xs font-black text-white transition hover:brightness-105"
          >
            ✕ Leave
          </button>
        </div>
      </div>

      {showCode && <CodeEditor lobbyId={lobbyId} onClose={() => setShowCode(false)} />}
    </>
  );
}
