import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PartyPanel() {
  const { user } = useAuth();
  const [partyCode, setPartyCode] = useState("");
  const [showInput, setShowInput] = useState(false);

  const createParty = async () => {
    if (!user) {
      toast.error("Login to create a party");
      return;
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from("lobbies").insert({
      name: `${code}'s Party`,
      game_mode: "sandbox",
      host_id: user.id,
      party_code: code,
      is_public: false,
    });
    if (error) {
      toast.error("Failed to create party");
      return;
    }
    toast.success(`Party created! Code: ${code}`);
    navigator.clipboard.writeText(code);
  };

  const joinParty = async () => {
    if (!partyCode.trim()) return;
    const { data } = await supabase
      .from("lobbies")
      .select("*")
      .eq("party_code", partyCode.toUpperCase())
      .single();
    if (!data) {
      toast.error("Party not found");
      return;
    }
    toast.success(`Joining ${data.name}!`);
    setShowInput(false);
  };

  return (
    <div className="flex items-center gap-2">
      {showInput ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={partyCode}
            onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
            placeholder="Party Code"
            className="w-28 rounded-full border border-white/10 bg-[#1f2d48] px-3 py-1.5 text-sm font-semibold text-white placeholder:text-white/40"
            maxLength={6}
          />
          <button
            onClick={joinParty}
            className="rounded-full bg-[#32c235] px-3 py-1.5 text-sm font-black text-[#082109] shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
          >
            Join
          </button>
          <button onClick={() => setShowInput(false)} className="px-2 text-sm text-white/55">✕</button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowInput(true)}
            className="rounded-full border border-white/10 bg-[#202945] px-4 py-1.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:bg-[#283350]"
          >
            # Party Code
          </button>
          <button
            onClick={() => setShowInput(true)}
            className="rounded-full border border-white/10 bg-[#202945] px-4 py-1.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:bg-[#283350]"
          >
            👥 Join Party
          </button>
          <button
            onClick={createParty}
            className="rounded-full border border-white/10 bg-[#202945] px-4 py-1.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:bg-[#283350]"
          >
            🎮 Create Party
          </button>
        </>
      )}
    </div>
  );
}
