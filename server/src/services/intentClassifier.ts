// server/src/services/intentClassifier.ts

export type IntentClassification = {
  intent: string;
  confidence?: number;
  meta?: Record<string, unknown>;
};

/**
 * TODO: Replace with your real intent classification logic.
 * This stub exists to unblock TypeScript compilation on Render.
 */
export async function intentClassifier(_text: string): Promise<IntentClassification> {
  return { intent: "unknown", confidence: 0.0 };
}
