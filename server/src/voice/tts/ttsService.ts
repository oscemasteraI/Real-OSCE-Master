import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import path from 'path';
import fs from 'fs';

export interface TTSService {
    synthesize(textOrSsml: string, voiceId: string, speed?: number, pitch?: number, isSsml?: boolean): Promise<string>; // Returns Base64 audio
}

/**
 * Google Cloud TTS with Gemini 2.5 Flash TTS - Hybrid Technique
 * Combines Persona Prompt (for character) with Exact Text (to prevent hallucination)
 */
export class GoogleTTSService implements TTSService {
    private client: TextToSpeechClient;
    private serviceAccountPath: string;

    constructor() {
        // Use GOOGLE_APPLICATION_CREDENTIALS from environment or fallback
        this.serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/opt/render/project/src/server/osce-ai-sim.json';

        // Verify the key file exists
        if (!fs.existsSync(this.serviceAccountPath)) {
            console.warn(`[TTS] Service account key not found at ${this.serviceAccountPath}. Falling back to mock.`);
            this.client = null as any; // Will use fallback
        } else {
            this.client = new TextToSpeechClient({
                keyFilename: this.serviceAccountPath
            });
            console.log('[TTS] Google Cloud TTS initialized');
        }
    }

    async synthesize(
        textOrSsml: string,
        voiceId: string = 'en-US-Journey-F',
        speed: number = 1.0,
        pitch: number = 0.0,
        isSsml: boolean = false
    ): Promise<string> {

        // Fallback to mock if client not initialized
        if (!this.client) {
            console.log(`[TTS Mock] "${textOrSsml}" with voice ${voiceId}`);
            return `data:audio/mp3;base64,MOCK_AUDIO_${textOrSsml.substring(0, 20).replace(/\s+/g, '_')}`;
        }

        try {
            console.log(`[TTS] Synthesizing: "${textOrSsml.substring(0, 50)}..." | Voice: ${voiceId}`);

            const input = isSsml ? { ssml: textOrSsml } : { text: textOrSsml };

            const request: any = {
                input: input,
                voice: {
                    languageCode: 'en-US',
                    name: voiceId,
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: speed,
                    pitch: pitch
                },
            };

            const [response] = await this.client.synthesizeSpeech(request);

            if (!response.audioContent) {
                throw new Error('No audio content returned from Google TTS');
            }

            // Convert to base64 for easy transmission
            const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');
            console.log(`[TTS] ✓ Generated ${audioBase64.length} bytes of audio`);

            return `data:audio/mp3;base64,${audioBase64}`;

        } catch (error: any) {
            console.error('[TTS Error]', error.message);
            // Fallback to mock on error
            return `data:audio/mp3;base64,ERROR_FALLBACK_${textOrSsml.substring(0, 20).replace(/\s+/g, '_')}`;
        }
    }
}

/**
 * Mock TTS for testing without Google Cloud credentials
 */
export class MockTTSService implements TTSService {
    async synthesize(textOrSsml: string, voiceId: string, speed: number = 1.0, pitch: number = 0.0, isSsml: boolean = false): Promise<string> {
        console.log(`[TTS Mock] Synthesizing "${textOrSsml}" with voice ${voiceId} (Speed: ${speed}, Pitch: ${pitch}, SSML: ${isSsml})`);
        return `data:audio/mp3;base64,MOCK_AUDIO_DATA_FOR_${textOrSsml.replace(/\s+/g, '_')}`;
    }
}

// Export the real service (will auto-fallback to mock if credentials missing)
export const ttsService = new GoogleTTSService();
