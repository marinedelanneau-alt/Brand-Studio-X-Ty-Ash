import { isTyAshContent } from "./tyash-answer-identity";

// Product scope, independent of draft/publication flags. Existing roadmap data
// stays stored; publishing content cannot bring this retired TYASH feature back.
export function communicationActionPlanEnabled(content?: { stableKey?: string } | Array<{ stableKey?: string }>) {
  const entities = Array.isArray(content) ? content : content ? [content] : [];
  return process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co"
    && !entities.some(isTyAshContent);
}

// Retired throughout TYASH, including draft previews and stale client sessions.
// Original Brand Studio keeps its independent assistance feature.
export function answerAssistanceEnabled(content?: { stableKey?: string } | Array<{ stableKey?: string }>) {
  const entities = Array.isArray(content) ? content : content ? [content] : [];
  return process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://cplzwnlstcpqqzqeawgs.supabase.co"
    && !entities.some(isTyAshContent);
}
