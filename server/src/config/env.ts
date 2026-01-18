import dotenv from 'dotenv';
import path from 'path';

// Explicitly load the .env file from the server directory
const envPath = path.resolve(__dirname, '../../.env');
console.log("[EnvLoader] Loading .env from:", envPath);
dotenv.config({ path: envPath });

// Use GOOGLE_APPLICATION_CREDENTIALS from environment
import fs from 'fs';

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/opt/render/project/src/server/osce-ai-sim.json';

if (!fs.existsSync(credentialsPath)) {
    console.error("[EnvLoader] FATAL: Google Cloud JSON Key not found at:", credentialsPath);
} else {
    console.log("[EnvLoader] Google Cloud JSON Key found at:", credentialsPath);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}
