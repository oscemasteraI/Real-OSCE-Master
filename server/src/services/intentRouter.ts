// server/src/services/intentRouter.ts

// patientService.ts expects these enum members to exist
export enum IntentCategory {
  CONVERSATIONAL = "CONVERSATIONAL",
  UNCLEAR = "UNCLEAR",

  HISTORY = "HISTORY",
  EXAM = "EXAM",
  MANAGEMENT = "MANAGEMENT",
  SUMMARY = "SUMMARY",
  OTHER = "OTHER"
}

export type IntentRouteResult = {
  category: IntentCategory;
  confidence?: number;
  meta?: Record<string, unknown>;
};

/**
 * patientService.ts seems to call intentRouter.route(...) with varying args.
 * Make it permissive: accept a string OR an object (and ignore extra args).
 */
export const intentRouter = {
  async route(
    input: string | { text: string; userId?: string; sessionId?: string },
    _maybeUserId?: string,
    _maybeSessionId?: string
  ): Promise<IntentRouteResult> {
    const text = typeof input === "string" ? input : input?.text ?? "";
    // Basic stub routing
    if (!text.trim()) return { category: IntentCategory.UNCLEAR, confidence: 0.0 };
    return { category: IntentCategory.CONVERSATIONAL, confidence: 0.1 };
  }
};
