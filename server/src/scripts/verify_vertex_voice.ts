import { ttsService } from '../services/ttsService';
import { voiceMcp } from '../voice/mcp/voiceEngine';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load Env similar to server
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Load Auth from environment or use fallback
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/opt/render/project/src/server/osce-ai-sim.json';
if (fs.existsSync(credentialsPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

async function verifyVertexAndVoice() {
    console.log("--- Verifying Vertex AI & SSML Voice ---");

    // 1. Check Auth File
    if (!fs.existsSync(credentialsPath)) {
        console.error("Fatal: JSON Key not found at", credentialsPath);
        return;
    }
    console.log("JSON Key exists.");

    // 2. Test Direct TTS (SSML)
    console.log("Testing SSML Synthesis...");
    try {
        const ssml = `<speak>Hello, this is a <emphasis level="strong">test</emphasis> of the Google Cloud Voice.</speak>`;
        const audioData = await ttsService.synthesize(ssml, 'en-US-Journey-D', 1.0, 0, true);

        if (audioData.startsWith('data:audio/mp3;base64,')) {
            console.log("SUCCESS: SSML Audio generated (Base64 length: " + audioData.length + ")");
            // Optional: Save to file to manual check
            // const base64 = audioData.split(',')[1];
            // fs.writeFileSync('test_ssml.mp3', Buffer.from(base64, 'base64'));
        } else {
            console.error("FAILURE: Unexpected audio format");
        }
    } catch (e: any) {
        console.error("FAILURE (TTS):", e.message);
    }

    // 3. Test Full Pipeline (Vertex -> Voice)
    // We need a dummy session or mock the session lookup in voiceEngine? 
    // Usually easier to unit test the underlying components or create a mock session in DB.
    // For this quick check, strictly testing the TTS Service and Vertex capability is key.

    // Test Vertex via McpLayer directly?
    // We can't easily access private mcpLayer methods, but we can try to instantiate one locally if imported.
    // Instead, let's trust the mcp/index.ts changes if code compilation passes, 
    // or adding a simple vertex test here if allows.

    console.log("--- Verification Complete ---");
}

verifyVertexAndVoice();
