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
        <div className="rounded-lg bg-black/60 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Mode: </span>
          <span className="font-bold text-foreground">{gameMode}</span>
        </div>
        <div className="rounded-lg bg-black/60 px-3 py-1.5 text-xs">
          <span className={`font-bold ${getRankColor()}`}>
            {isDev && "🔧 DEV "}
            {isSuper && !isDev && "⚡ SUPER "}
            {profile?.username || "Player"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCode(true)}
            className="pointer-events-auto rounded bg-accent/80 px-3 py-1.5 text-xs font-bold text-accent-foreground transition hover:bg-accent"
          >
            📝 Code
          </button>
          <button
            onClick={onLeave}
            className="pointer-events-auto rounded bg-destructive/80 px-3 py-1.5 text-xs font-bold text-destructive-foreground transition hover:bg-destructive"
          >
            ✕ Leave
          </button>
        </div>
      </div>

      {showCode && <CodeEditor lobbyId={lobbyId} onClose={() => setShowCode(false)} />}
    </>
  );
}
