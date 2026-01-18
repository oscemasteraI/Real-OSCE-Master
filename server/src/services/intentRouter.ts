// server/src/services/intentRouter.ts

export type IntentRouteResult = {
  route: string;
  confidence?: number;
  meta?: Record<string, unknown>;
};

/**
 * TODO: Replace with your real routing logic.
 * This stub exists to unblock TypeScript compilation on Render.
 */
export async function intentRouter(_input: {
  text: string;
  userId?: string;
  sessionId?: string;
}): Promise<IntentRouteResult> {
  return { route: "default", confidence: 0.0 };
}
