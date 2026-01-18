// server/src/services/intentClassifier.ts

export type IntentCode = string;

export type IntentClassification = {
  intent: IntentCode;
  confidence?: number;
  meta?: Record<string, unknown>;
};

export const intentClassifier = {
  async classify(_message: string): Promise<IntentClassification> {
    return { intent: "UNKNOWN", confidence: 0.0 };
  }
};
