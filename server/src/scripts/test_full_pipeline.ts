```typescript

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load Env
const envPath = path.resolve(__dirname, '../../.env'); // Define envPath here
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

// Set Google Credentials for Vertex AI
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/opt/render/project/src/server/osce-ai-sim.json';
if (fs.existsSync(credentialsPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}
console.log("Credentials Path:", credentialsPath);


// Now import services (after env is loaded)
const { intentRouter, IntentCategory } = require('../services/intentRouter');
const { intentClassifier } = require('../services/intentClassifier');
const { conversationalHandler } = require('../services/conversationalHandler');
const { caseFactResolver } = require('../services/caseFactResolver');
const { IntentCode } = require('../types/intents');

// Mock Case Data
const mockCase: any = {
    truth: {
        demographics: { age: 45, sex: 'male', name: 'John' },
        history: {
            chief_complaint: "I have chest pain",
            onset: "It started 2 hours ago",
            duration: "2 hours",
            character: "Crushing, heavy pain",
            radiation: "Down my left arm",
            severity: "8/10",
            associated_symptoms: ["sweating", "nausea"]
        }
    }
};

const testQueries = [
    "Hello",
    "Good morning doctor",
    "How are you?",
    "When did the pain start?",
    "How long have you had it?",
    "Can you describe the pain?",
    "Do you have any allergies?",
    "I want to listen to your heart",
    "Thank you",
    "random gibberish"
];

async function runDiagnostics() {
    console.log("=== FULL PIPELINE DIAGNOSTIC ===");
    console.log("API KEY PRESENT:", !!process.env.GEMINI_API_KEY);

    for (const query of testQueries) {
        console.log(`\n\n >>> INPUT: "${query}"`);

        // 1. ROUTER SSTEP
        console.log("--- Step 1: Intent Router ---");
        try {
            const route = await intentRouter.route(query);
            console.log(`Router Result: ${ route.category } (Conf: ${ route.confidence })`);

            if (route.category === IntentCategory.CONVERSATIONAL) {
                console.log("-> Path: CONVERSATIONAL");
                const response = await conversationalHandler.generateResponse(query, mockCase);
                console.log(`-> Response: "${response}"`);
            } else {
                console.log("-> Path: CLINICAL (Default)");

                // 2. SINL STEP
                console.log("--- Step 2: SINL (Classifier) ---");
                const sinlResult = await intentClassifier.classify(query);
                console.log(`SINL Intent: ${ sinlResult.intent } `);

                if (sinlResult.intent === 'UNKNOWN') { // String comparison or enum
                    console.log("!!! SINL FAILED TO IDENTIFY INTENT !!!");
                } else {
                    // 3. FACT RESOLVER STEP
                    console.log("--- Step 3: Fact Resolver ---");
                    const fact = caseFactResolver.resolve(sinlResult.intent, mockCase);
                    console.log(`Fact: "${fact}"`);
                }
            }

        } catch (e) {
            console.error("CRITICAL ERROR:", e);
        }
    }
}

runDiagnostics();
