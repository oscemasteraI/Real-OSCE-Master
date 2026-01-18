// server/src/services/conversationalHandler.ts

export type ConversationalHandlerResult = {
  reply: string;
  meta?: Record<string, unknown>;
};

/**
 * patientService.ts is passing a string in at least one place.
 * Accept string OR object, and tolerate extra args.
 */
export const conversationalHandler = {
  async generateResponse(
    input: string | { text: string; userId?: string; sessionId?: string },
    _maybeUserId?: string,
    _maybeSessionId?: string
  ): Promise<ConversationalHandlerResult> {
    const text = typeof input === "string" ? input : input?.text ?? "";
    return { reply: text ? "OK" : "Please provide a message." };
  }
};
