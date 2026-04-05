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
            className="w-28 rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground"
            maxLength={6}
          />
          <button onClick={joinParty} className="rounded bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
            Join
          </button>
          <button onClick={() => setShowInput(false)} className="text-sm text-muted-foreground">✕</button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowInput(true)}
            className="rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            # Party Code
          </button>
          <button
            onClick={() => setShowInput(true)}
            className="rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            👥 Join Party
          </button>
          <button
            onClick={createParty}
            className="rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            🎮 Create Party
          </button>
        </>
      )}
    </div>
  );
}
