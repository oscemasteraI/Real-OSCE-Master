// server/src/services/intentClassifier.ts

export type IntentClassification = {
  intent: string;
  confidence?: number;
  meta?: Record<string, unknown>;
};

/**
 * patientService.ts is calling intentClassifier.classify(...)
 * so we export an object with a classify() method.
 */
export const intentClassifier = {
  async classify(_text: string): Promise<IntentClassification> {
    return { intent: "unknown", confidence: 0.0 };
  }
};
