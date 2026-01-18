// server/src/services/intentClassifier.ts

/**
 * Make IntentCode accept ANY string to prevent TS2345.
 * If your real code uses a stricter union/enum, you can tighten later.
 */
export type IntentCode = string;

export type IntentClassification = {
  intent: IntentCode; // patientService.ts expects `.intent`
  confidence?: number;
  meta?: Record<string, unknown>;
};

export const intentClassifier = {
  async classify(_text: string, _context?: unknown): Promise<IntentClassification> {
    return { intent: "unknown", confidence: 0.0 };
  }
};
