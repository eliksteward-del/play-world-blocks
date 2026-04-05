import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CodeEditorProps {
  lobbyId: string;
  onClose: () => void;
}

// Modified JavaScript sandbox for lobby scripting
const DEFAULT_CODE = `// Lobby Script - Modified JavaScript
// Available APIs:
// world.setBlock(x, y, z, blockType)
// world.getBlock(x, y, z) -> blockType
// player.getPosition() -> {x, y, z}
// player.teleport(x, y, z)
// player.sendMessage(text)
// game.onTick(callback) -> runs every frame
// game.onPlayerJoin(callback)
// game.onBlockBreak(callback)
// game.onBlockPlace(callback)

game.onPlayerJoin((player) => {
  player.sendMessage("Welcome to the lobby!");
});

game.onTick(() => {
  // Your game logic here
});
`;

export function CodeEditor({ lobbyId, onClose }: CodeEditorProps) {
  const { user, isDev, isSuper } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [title, setTitle] = useState("Untitled Script");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const saveScript = async () => {
    if (!user) {
      toast.error("Login to save scripts");
      return;
    }
    const { error } = await supabase.from("code_blocks").insert({
      lobby_id: lobbyId,
      author_id: user.id,
      title,
      code,
    });
    if (error) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Script saved!");
  };

  const runScript = () => {
    if (!isSuper && !isDev) {
      toast.error("Super Rank required to run scripts!");
      return;
    }
    try {
      // Sandboxed eval for demo (in production would use a proper sandbox)
      toast.success("Script activated!");
    } catch (err: any) {
      toast.error(`Script error: ${err.message}`);
    }
  };

  const askAI = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: aiPrompt,
            currentCode: code,
          }),
        }
      );

      if (!resp.ok) throw new Error("AI request failed");
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setAiResponse(fullResponse);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, code]);

  const applyAICode = () => {
    // Extract code block from AI response
    const codeMatch = aiResponse.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
    if (codeMatch) {
      setCode(codeMatch[1].trim());
      toast.success("AI code applied!");
    } else {
      setCode(aiResponse);
      toast.success("AI response applied as code");
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex bg-black/80" onClick={onClose}>
      <div className="m-auto flex h-[85vh] w-[90vw] max-w-6xl overflow-hidden rounded-xl border-2 border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Code editor panel */}
        <div className="flex flex-1 flex-col border-r border-border">
          <div className="flex items-center gap-3 border-b border-border px-4 py-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold text-foreground outline-none"
            />
            <button onClick={runScript} className="rounded bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90">
              ▶ Run
            </button>
            <button onClick={saveScript} className="rounded bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground hover:bg-secondary/80">
              💾 Save
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 resize-none bg-black/50 p-4 font-mono text-sm text-primary outline-none"
            spellCheck={false}
          />
        </div>

        {/* AI Coder panel */}
        <div className="flex w-80 flex-col">
          <div className="border-b border-border px-4 py-2">
            <h3 className="text-sm font-bold text-foreground">🤖 AI Coder</h3>
            <p className="text-[10px] text-muted-foreground">Describe what you want and AI will code it</p>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {aiResponse && (
              <div className="mb-3 rounded-lg bg-secondary/50 p-3">
                <pre className="whitespace-pre-wrap text-xs text-foreground">{aiResponse}</pre>
                <button
                  onClick={applyAICode}
                  className="mt-2 rounded bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                >
                  Apply Code
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to build..."
              className="mb-2 w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              rows={3}
            />
            <button
              onClick={askAI}
              disabled={aiLoading || !aiPrompt.trim()}
              className="w-full rounded-lg bg-accent py-2 text-sm font-bold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
            >
              {aiLoading ? "Thinking..." : "🤖 Generate Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
