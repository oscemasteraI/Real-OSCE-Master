// server/src/services/intentRouter.ts

// patientService.ts expects this to exist
export enum IntentCategory {
  HISTORY = "History",
  EXAM = "Exam",
  MANAGEMENT = "Management",
  SUMMARY = "Summary",
  OTHER = "Other"
}

export type IntentRouteResult = {
  category: IntentCategory;
  confidence?: number;
  meta?: Record<string, unknown>;
};

/**
 * patientService.ts is calling intentRouter.route(...)
 * so we export an object with a route() method.
 */
export const intentRouter = {
  async route(_input: {
    text: string;
    userId?: string;
    sessionId?: string;
  }): Promise<IntentRouteResult> {
    return { category: IntentCategory.OTHER, confidence: 0.0 };
  }
};
