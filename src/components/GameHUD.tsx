import { HOTBAR_BLOCKS, BLOCK_COLORS, BLOCK_NAMES } from "../game/blocks";
import type { DevInfo } from "../game/engine";

interface GameHUDProps {
  selectedSlot: number;
  isDev?: boolean;
  devInfo?: DevInfo | null;
}

export function GameHUD({ selectedSlot, isDev, devInfo }: GameHUDProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-7 w-7">
          <div className="absolute top-1/2 left-0 h-[3px] w-full -translate-y-1/2 bg-white/80 shadow-[0_0_6px_rgba(0,0,0,0.35)]" />
          <div className="absolute top-0 left-1/2 h-full w-[3px] -translate-x-1/2 bg-white/80 shadow-[0_0_6px_rgba(0,0,0,0.35)]" />
          <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
        </div>
      </div>

      {/* Hotbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="rounded-2xl border border-[#5d6f96] bg-[#111728]/90 px-2 py-1.5 shadow-[0_16px_32px_rgba(4,8,20,0.35)] backdrop-blur-sm">
          <div className="flex gap-1">
          {HOTBAR_BLOCKS.map((block, i) => {
            const colors = BLOCK_COLORS[block];
            const isSelected = i === selectedSlot;
            return (
              <div
                key={i}
                className={`relative flex h-14 w-14 items-center justify-center rounded-lg border-2 transition-all ${
                  isSelected
                    ? "scale-105 border-white bg-[#25395f]"
                    : "border-[#45597f] bg-[#1a2743]"
                }`}
                style={{
                  boxShadow: isSelected
                    ? "inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(255,255,255,0.04)"
                    : "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="h-9 w-9 rounded-md border border-black/10"
                  style={{
                    background: `linear-gradient(135deg, #${colors.top.toString(16).padStart(6, "0")} 0%, #${colors.side.toString(16).padStart(6, "0")} 100%)`,
                    boxShadow: isSelected ? "0 0 14px rgba(255,255,255,0.14)" : "none",
                  }}
                />
                <span className="absolute top-1 left-1 text-[10px] font-black leading-none text-white/75">
                  {i + 1}
                </span>
              </div>
            );
          })}
          </div>
        </div>
        <div className="mt-2 text-center text-sm font-black text-white/90 [text-shadow:0_1px_0_rgba(0,0,0,0.4)]">
          {BLOCK_NAMES[HOTBAR_BLOCKS[selectedSlot]]}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 left-4 rounded-xl border border-white/8 bg-[#111728]/80 px-3 py-2 text-xs text-white/75 shadow-[0_10px_30px_rgba(4,8,20,0.28)] backdrop-blur-sm">
        <p>WASD - Move | Space - Jump | Shift - Sprint</p>
        <p>Left Click - Break | Right Click - Place</p>
        <p>Scroll / 1-9 - Select Block</p>
        {isDev && <p className="mt-1 text-[#f97316]/80">F - Fly | G - No-Clip | 2× Speed</p>}
      </div>

      {/* Dev overlay */}
      {isDev && devInfo && (
        <div className="absolute top-4 right-4 rounded-xl border border-[#f97316]/30 bg-[#111728]/90 px-3 py-2 text-xs text-white/85 shadow-[0_10px_30px_rgba(4,8,20,0.4)] backdrop-blur-sm font-mono">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="rounded bg-[#f97316] px-1.5 py-0.5 text-[10px] font-black text-black">🔧 DEV</span>
            {devInfo.flyMode && <span className="rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white">FLY</span>}
            {devInfo.noClip && <span className="rounded bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white">NOCLIP</span>}
          </div>
          <p>XYZ: {devInfo.pos.x} / {devInfo.pos.y} / {devInfo.pos.z}</p>
          <p>Chunk: {devInfo.chunk.cx}, {devInfo.chunk.cz}</p>
          <p>FPS: {devInfo.fps}</p>
        </div>
      )}
    </div>
  );
}
