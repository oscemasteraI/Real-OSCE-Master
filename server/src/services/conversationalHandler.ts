// server/src/services/conversationalHandler.ts

export type ConversationalHandlerResult = {
  reply: string;
  meta?: Record<string, unknown>;
};

export const conversationalHandler = {
  /**
   * Accept ANY input (string, object, OsceCaseV2, etc.)
   * and make other args optional.
   */
  async generateResponse(
    _input: any,
    _maybeUserId?: string,
    _maybeSessionId?: string
  ): Promise<ConversationalHandlerResult> {
    return { reply: "OK" };
  }
};
