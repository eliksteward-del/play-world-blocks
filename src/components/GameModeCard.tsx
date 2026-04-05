interface GameMode {
  id: string;
  name: string;
  players: number;
  popular?: boolean;
  ranked?: boolean;
  color: string;
  desc: string;
}

export function GameModeCard({
  mode,
  playerCount,
  onClick,
}: {
  mode: GameMode;
  playerCount: number;
  onClick: () => void;
}) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-border/30 bg-card/50 transition-all hover:scale-105 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/10"
      onClick={onClick}
    >
      {/* Tags */}
      <div className="absolute top-1 left-1 z-10 flex gap-1">
        {mode.popular && (
          <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
            Popular
          </span>
        )}
        {mode.ranked && (
          <span className="rounded bg-yellow-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
            Ranked
          </span>
        )}
      </div>

      {/* Player count */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5">
        <span className="text-[10px] text-foreground/80">👥</span>
        <span className="text-[10px] font-bold text-foreground">{playerCount}</span>
      </div>

      {/* Thumbnail */}
      <div
        className="aspect-[4/3]"
        style={{
          background: `linear-gradient(135deg, ${mode.color}40 0%, ${mode.color}20 50%, ${mode.color}10 100%)`,
        }}
      >
        <div className="flex h-full items-center justify-center">
          <div
            className="h-12 w-12 rounded-lg opacity-60"
            style={{ backgroundColor: mode.color }}
          />
        </div>
      </div>

      {/* Name */}
      <div className="p-2">
        <p className="truncate text-xs font-bold text-foreground">{mode.name}</p>
      </div>
    </div>
  );
}
