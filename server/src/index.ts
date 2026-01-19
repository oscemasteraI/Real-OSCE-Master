import './config/env'; // Load env before anything else!
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { caseService } from './services/caseService';
import { patientService } from './services/patientService';
import { evaluationService } from './services/evaluationService';
import adminRoutes from './routes/admin';
import { connectDB } from './config/db';
import passport, { initializePassport } from './config/googleAuth';
import { simulationEngine } from './engine/SimulationEngine';
import axios from 'axios';

// Initialize Services (No MCP)
// const mcpServer = new OSCEMcpServer(); // Removed

import casesRoutes from './routes/cases';
import sessionsRoutes from './routes/sessions';
import authRoutes from './routes/auth';
import paymentRoutes from './routes/payment';
import calendarRoutes from './routes/calendar';
import internalRoutes from './routes/internal';
import { ttsService } from './services/ttsService';
import engineRoutes from './routes/engine';
import voiceRoutes from './routes/voice';
import devAuthRoutes from './routes/devAuth';

import { voiceDecorator } from './voice/voiceDecorator';

const app = express();
const port = process.env.PORT || 3001;

// ✅ Passport init ONCE
initializePassport();

// ✅ CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow any localhost origin
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }

      // Allow specific production domains if needed
      if (origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }

      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ Session for Passport
app.use(
  session({
    // NOTE: ideally use SESSION_SECRET, but keeping your existing var for now
    secret: process.env.JWT_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

// ✅ Routes
app.use('/api/admin', adminRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dev-auth', devAuthRoutes); // DEV MODE: Bypass authentication
app.use('/api/payment', paymentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/engine', engineRoutes);
app.use('/api/voice', voiceRoutes); // New Voice Layer

// API Routes
app.post('/api/tts', async (req, res) => {
  try {
    const { text, gender } = req.body;
    const voiceId = gender === 'Male' ? 'en-US-Journey-D' : 'en-US-Journey-F';

    const dataUrl = await ttsService.synthesize(text, voiceId, 1.0, 0.0, false);
    const base64 = dataUrl.split(',')[1];

    res.json({ audioContent: base64 });
  } catch (error: any) {
    console.error('TTS Endpoint Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-case', async (req, res) => {
  try {
    const result = await caseService.getRandomCase(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const sessionId = req.headers['x-session-id'] as string;
    const caseId = (req.headers['x-case-id'] as string) || 'default-case';
    const userId = (req.user as any)?.id || 'anonymous';

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    console.log(`[API] Chat Request: "${message}" (Session: ${sessionId})`);

    const engineResponse = await simulationEngine.process(
      message,
      userId,
      caseId,
      sessionId
    );

    let audioContent = '';
    try {
      const cleanText = engineResponse.text.replace(/<[^>]*>/g, '');
      const ttsResponse = await axios.post(`http://localhost:${port}/api/tts`, {
        text: cleanText,
        gender: 'Female',
      });
      audioContent = ttsResponse.data.audioContent;
    } catch (ttsError) {
      console.error('[API] TTS Failed:', ttsError);
    }

    res.json({
      text: engineResponse.text,
      audio: audioContent,
      entry: {
        id: Date.now().toString(),
        role: 'model',
        content: engineResponse.text,
        timestamp: new Date(),
      },
      ...engineResponse.meta,
    });
  } catch (error) {
    console.error('[API] Chat Error:', error);
    res.status(500).json({
      text: "I'm having a bit of a dizzy spell. Can you repeat that?",
      error: 'Internal Server Error',
    });
  }
});

app.post('/api/assess-ddx', async (req, res) => {
  try {
    const result = await evaluationService.assessDifferential(
      req.body.caseId,
      req.body.submittedDDx,
      req.body.stage
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const result = await evaluationService.evaluateSession(
      req.body.sessionId,
      req.body.transcript
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ✅ Start server ONLY after DB connect
let server: ReturnType<typeof app.listen>;

(async () => {
  try {
    // Extra guard: make sure Render env var is present and not malformed
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      throw new Error(
        'MONGODB_URI is missing. Set it in Render Environment Variables.'
      );
    }
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error(
        `Invalid MONGODB_URI. Must start with mongodb:// or mongodb+srv://`
      );
    }

    await connectDB();

    server = app.listen(port, () => {
      console.log(`[OSCE Server] Server running on port ${port}`);
    });

    // Robust Error Handling for Startup
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[FATAL] Port ${port} is already in use.`);
        process.exit(1);
      } else {
        console.error('[FATAL] An error occurred starting the server:', error);
        process.exit(1);
      }
    });

    // Graceful Shutdown
    const gracefulShutdown = () => {
      console.log('[OSCE Server] Received kill signal, shutting down gracefully...');

      server?.close(() => {
        console.log('[OSCE Server] Closed out remaining connections.');
        process.exit(0);
      });

      setTimeout(() => {
        console.error(
          '[OSCE Server] Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err: any) {
    console.error('[FATAL] Startup failed:', err?.message || err);
    process.exit(1);
  }
})();
