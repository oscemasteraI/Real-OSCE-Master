import { intentRouter, IntentCategory } from './intentRouter';
import { intentClassifier } from './intentClassifier';
import { conversationalHandler } from './conversationalHandler';
import { mcpGate } from '../mcp/policies/mcpGate';
import { caseFactResolver } from './caseFactResolver';
import { responseMapper } from './responseMapper';
import { sessionService } from './sessionService';
import { caseService } from './caseService';
import { OsceCaseV2 } from '../schemas/caseSchema';

export class PatientService {

  // V2: Dual-Path Intent Routing Pipeline
  async interactV2(
    message: string,
    caseId: string,
    sessionId: string,
    userId: string = 'anonymous'
  ) {
    try {
      console.log(`\n=== [DUAL-PATH PIPELINE START] ===`);
      console.log(`[USER INPUT] "${message}"`);
      console.log(`[DEBUG] SessionID: ${sessionId}, CaseID: ${caseId}, UserID: ${userId}`);

      // 1. Load Session
      let session = await sessionService.findActiveSession(userId, caseId);

      if (!session) {
        console.warn(`[PatientService] Session not found. Creating new session.`);
        session = await sessionService.createSession(userId, caseId);
      }

      if (!session) throw new Error('Failed to initialize session');

      // 2. Load Case
      const osceCase = await caseService.getCaseById(caseId);
      if (!osceCase) throw new Error('Case not found');

      // 3. INTENT ROUTING
      const routeResult = await intentRouter.route(message);
      console.log(`[ROUTER] Category: ${routeResult.category}`);

      // === PATH 1: CONVERSATIONAL ===
      if (routeResult.category === IntentCategory.CONVERSATIONAL) {
        console.log(`[PATH] Conversational`);

        if ((osceCase as any).truth) {
          const response = await conversationalHandler.generateResponse(
            message,
            osceCase as unknown as OsceCaseV2
          );

          console.log(`[RESPONSE] "${response}"`);
          console.log(`=== [PIPELINE END] ===\n`);

          return {
            text: response,
            data: {
              category: 'conversational',
              intent: null
            }
          };
        }

        console.log(`=== [PIPELINE END] ===\n`);
        return { text: 'I understand.' };
      }

      // === PATH 2: UNCLEAR ===
      if (routeResult.category === IntentCategory.UNCLEAR) {
        console.log(`[PATH] Unclear`);
        console.log(`=== [PIPELINE END] ===\n`);

        return {
          text: "I'm sorry, could you rephrase that?",
          data: {
            category: 'unclear',
            intent: null
          }
        };
      }

      // === PATH 3: CLINICAL ===
      console.log(`[PATH] Clinical`);

      // 4. Intent Classification
      const intentResult = await intentClassifier.classify(message);
      console.log(`[SINL] ${intentResult.intent}`);

      // 🔧 FIX #1 — cast to satisfy IntentCode
      const gateResult = mcpGate.check(
        session.currentStage,
        intentResult.intent as any
      );

      if (!gateResult.allowed) {
        console.log(`[MCP] Blocked: ${gateResult.reason}`);
        console.log(`=== [PIPELINE END] ===\n`);
        return { text: gateResult.reason };
      }

      console.log(`[MCP] Allowed`);

      // 5. Repeated Fact Check
      if (!['GREETING', 'UNKNOWN'].includes(intentResult.intent)) {
        if (session.revealedFacts?.includes(intentResult.intent)) {
          console.log(`[MCP] Fact already revealed`);
          console.log(`=== [PIPELINE END] ===\n`);
          return { text: 'I believe I already mentioned that.' };
        }
      }

      // 6. Case Fact Resolution
      let factText = '';

      if ((osceCase as any).truth) {
        // 🔧 FIX #2 — cast to satisfy IntentCode
        factText = caseFactResolver.resolve(
          intentResult.intent as any,
          osceCase as unknown as OsceCaseV2
        );
      } else {
        factText = 'I am not feeling well.';
      }

      // 7. Response Mapping
      const finalResponse = responseMapper.map(factText);
      console.log(`[RESPONSE] Final: "${finalResponse.text}"`);

      // 8. Update Session
      const updates: Partial<any> = { lastInteraction: new Date() };

      if (!['GREETING', 'UNKNOWN'].includes(intentResult.intent)) {
        if (!session.revealedFacts) session.revealedFacts = [];
        session.revealedFacts.push(intentResult.intent);
        updates.revealedFacts = session.revealedFacts;
      }

      const dbSessionId =
        (session as any)._id?.toString() ?? sessionId;

      await sessionService.updateSession(dbSessionId, updates);

      console.log(`=== [PIPELINE END] ===\n`);

      return {
        text: finalResponse.text,
        data: {
          category: 'clinical',
          intent: intentResult.intent,
          meta: finalResponse
        }
      };

    } catch (error) {
      console.error('PatientService Pipeline Error:', error);
      return {
        text: "I'm having trouble understanding. (System Error)"
      };
    }
  }

  // Legacy V1
  async interactV1(message: string, history: any[], caseData: any) {
    return {
      role: 'model',
      content: 'Legacy V1 Engine is disabled.'
    };
  }
}

export const patientService = new PatientService();
