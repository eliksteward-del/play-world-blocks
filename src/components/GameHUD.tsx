import { HOTBAR_BLOCKS, BLOCK_COLORS, BLOCK_NAMES } from "../game/blocks";

interface GameHUDProps {
  selectedSlot: number;
}

export function GameHUD({ selectedSlot }: GameHUDProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-6 w-6">
          <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-foreground opacity-70" />
          <div className="absolute top-0 left-1/2 h-full w-[2px] -translate-x-1/2 bg-foreground opacity-70" />
        </div>
      </div>

      {/* Hotbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex gap-[2px] rounded-sm border-2 border-hotbar-border bg-hotbar-bg p-[2px]">
          {HOTBAR_BLOCKS.map((block, i) => {
            const colors = BLOCK_COLORS[block];
            const isSelected = i === selectedSlot;
            return (
              <div
                key={i}
                className={`relative flex h-12 w-12 items-center justify-center rounded-sm border-2 transition-all ${
                  isSelected ? "border-hotbar-selected scale-110" : "border-hotbar-border"
                }`}
              >
                <div
                  className="h-8 w-8 rounded-sm"
                  style={{
                    background: `linear-gradient(135deg, #${colors.top.toString(16).padStart(6, "0")}, #${colors.side.toString(16).padStart(6, "0")})`,
                    boxShadow: isSelected ? "0 0 8px rgba(255,255,255,0.3)" : "none",
                  }}
                />
                <span className="absolute -bottom-0.5 right-0.5 text-[10px] font-bold text-foreground opacity-60">
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-center text-sm font-medium text-foreground opacity-80">
          {BLOCK_NAMES[HOTBAR_BLOCKS[selectedSlot]]}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 left-4 rounded bg-hotbar-bg px-3 py-2 text-xs text-foreground opacity-60">
        <p>WASD - Move | Space - Jump | Shift - Sprint</p>
        <p>Left Click - Break | Right Click - Place</p>
        <p>Scroll / 1-9 - Select Block</p>
      </div>
    </div>
  );
}
