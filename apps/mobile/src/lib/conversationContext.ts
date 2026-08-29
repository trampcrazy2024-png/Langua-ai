import type { ChatTurn } from "./aiProviders";

// Context Manager: without this, every turn resent the ENTIRE conversation
// history, so a long Speaking Mode session (or a long typed chat) kept
// growing the prompt forever - slower every turn, and eventually exceeding
// the context window of a small local model. This caps what's sent
// verbatim and folds anything older into a short rolling summary instead
// of silently dropping it.

const MAX_RAW_TURNS = 14; // kept verbatim in every request

export interface ContextWindow {
  turns: ChatTurn[]; // what to actually send as "history" this turn
  droppedCount: number; // how many of the oldest turns are outside the window
}

export function buildContextWindow(history: ChatTurn[]): ContextWindow {
  if (history.length <= MAX_RAW_TURNS) return { turns: history, droppedCount: 0 };
  return { turns: history.slice(-MAX_RAW_TURNS), droppedCount: history.length - MAX_RAW_TURNS };
}

/**
 * One-shot summarization of turns that just fell out of the window, so
 * long-term context is compressed rather than lost. Costs one extra short
 * completion each time the window advances past previously-summarized
 * turns - callers should track how many turns they've already folded in
 * (see ChatTab.tsx's summarizedRawCountRef) and only call this for the
 * newly-dropped slice, not the whole history each time.
 */
export async function summarizeOlderTurns(
  chat: (payload: {
    message: string;
    history: ChatTurn[];
    dialect: string;
    personaName: string;
    personaTrait: string;
    task?: "chat";
  }) => Promise<string>,
  newlyDroppedTurns: ChatTurn[],
  dialect: string,
  personaName: string,
  personaTrait: string
): Promise<string> {
  const transcript = newlyDroppedTurns
    .map((t) => `${t.sender === "user" ? "Learner" : "Companion"}: ${t.text}`)
    .join("\n");
  const instruction = `Summarize the following earlier part of this conversation in 2-3 short Persian sentences, keeping any names, topics, or commitments that matter for continuing it naturally:\n${transcript}`;
  const raw = await chat({ message: instruction, history: [], dialect, personaName, personaTrait, task: "chat" });
  return raw.trim();
}
