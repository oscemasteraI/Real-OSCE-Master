// server/src/services/intentClassifier.ts

// patientService.ts expects IntentCode to accept strings
export type IntentCode = string;

export type IntentClassification = {
  code: IntentCode;
  confidence?: number;
  meta?: Record<string, unknown>;
};

/**
 * patientService.ts seems to call intentClassifier.classify(...) with 1 or 2 args.
 * Make it permissive.
 */
export const intentClassifier = {
  async classify(_text: string, _context?: unknown): Promise<IntentClassification> {
    return { code: "unknown", confidence: 0.0 };
  }
};
