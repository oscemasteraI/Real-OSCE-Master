// server/src/services/intentRouter.ts

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

export const intentRouter = {
  /**
   * Accept ANY input + extra args (patientService seems to call it in multiple ways).
   */
  async route(_input: any, _maybeUserId?: any, _maybeSessionId?: any): Promise<IntentRouteResult> {
    return { category: IntentCategory.CONVERSATIONAL, confidence: 0.1 };
  }
};
