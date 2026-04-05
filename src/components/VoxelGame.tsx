import { useEffect, useRef, useState, useCallback } from "react";
import { GameEngine } from "../game/engine";
import { GameHUD } from "./GameHUD";
import { LobbyHUD } from "./LobbyHUD";

interface VoxelGameProps {
  gameMode: string;
  lobbyId: string;
  onLeave: () => void;
}

export function VoxelGame({ gameMode, lobbyId, onLeave }: VoxelGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(0);

  const handleSlotChange = useCallback((slot: number) => {
    setSelectedSlot(slot);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, handleSlotChange);
    engineRef.current = engine;

    const preventContext = (e: Event) => e.preventDefault();
    containerRef.current.addEventListener("contextmenu", preventContext);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleSlotChange]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div ref={containerRef} className="h-full w-full" />
      <GameHUD selectedSlot={selectedSlot} />
      <LobbyHUD gameMode={gameMode} lobbyId={lobbyId} onLeave={onLeave} />
    </div>
  );
}
