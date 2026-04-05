interface GameMode {
  id: string;
  name: string;
  players: number;
  popular?: boolean;
  ranked?: boolean;
  color: string;
  desc: string;
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  const value = Number.parseInt(sanitized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const softTint = hexToRgba(mode.color, 0.1);
  const strongTint = hexToRgba(mode.color, 0.28);
  const highlightTint = hexToRgba(mode.color, 0.5);

  return (
    <button
      type="button"
      className="group relative overflow-hidden rounded-xl border border-[#223761] bg-[#182644] text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#355794] hover:brightness-110"
      onClick={onClick}
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 20px rgba(5,10,24,0.18)",
      }}
    >
      {/* Tags */}
      <div className="absolute top-1.5 left-1.5 z-10 flex gap-1">
        {mode.popular && (
          <span className="rounded-sm bg-[#ff160a] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white uppercase shadow-[0_1px_0_rgba(0,0,0,0.45)]">
            Popular
          </span>
        )}
        {mode.ranked && (
          <span className="rounded-sm bg-[#e59f19] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white uppercase shadow-[0_1px_0_rgba(0,0,0,0.45)]">
            Ranked
          </span>
        )}
      </div>

      {/* Player count */}
      <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 rounded-sm bg-[#111827]/95 px-1.5 py-0.5 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
        <span className="text-[10px] leading-none text-[#30a3ff]">👥</span>
        <span className="text-[10px] font-black leading-none text-white">{playerCount}</span>
      </div>

      {/* Thumbnail */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${softTint} 0%, ${strongTint} 100%)`,
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-8"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(12, 22, 38, 0.25) 100%)" }}
        />
        <div className="flex h-full items-center justify-center">
          <div
            className="h-12 w-12 rounded-2xl border border-white/6"
            style={{
              background: `linear-gradient(180deg, ${highlightTint} 0%, ${strongTint} 100%)`,
              boxShadow: `inset 0 1px 0 ${hexToRgba("#ffffff", 0.18)}, 0 0 0 1px ${hexToRgba(mode.color, 0.12)}`,
            }}
          />
        </div>
      </div>

      {/* Name */}
      <div className="border-t border-white/4 bg-[#16233d] px-2.5 py-2">
        <p className="truncate text-[13px] font-black tracking-[0.01em] text-white [text-shadow:0_1px_0_rgba(0,0,0,0.45)]">
          {mode.name}
        </p>
      </div>
    </button>
  );
}
