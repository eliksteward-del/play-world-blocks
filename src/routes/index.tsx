import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { MainMenu } from "@/components/MainMenu";
import { VoxelGame } from "@/components/VoxelGame";
import { Toaster } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [gameState, setGameState] = useState<{
    playing: boolean;
    gameMode: string;
    lobbyId: string;
  }>({ playing: false, gameMode: "sandbox", lobbyId: "" });

  const handlePlay = (mode: string, lobbyId?: string) => {
    setGameState({
      playing: true,
      gameMode: mode,
      lobbyId: lobbyId || crypto.randomUUID(),
    });
  };

  const handleLeave = () => {
    setGameState({ playing: false, gameMode: "sandbox", lobbyId: "" });
  };

  return (
    <AuthProvider>
      <Toaster position="top-center" />
      {gameState.playing ? (
        <VoxelGame
          gameMode={gameState.gameMode}
          lobbyId={gameState.lobbyId}
          onLeave={handleLeave}
        />
      ) : (
        <MainMenu onPlay={handlePlay} />
      )}
    </AuthProvider>
  );
}
