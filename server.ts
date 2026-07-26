import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Groq from 'groq-sdk';
import { google } from 'googleapis';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

async function startServer() {
  app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Routing is working' });
  });

  app.get('/api/test-gmail', async (req, res) => {
    try {
      const oAuth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
      );

      oAuth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 5,
        q: 'in:inbox',
      });

      const messages = response.data.messages || [];
      const emailDetails = [];

      for (const message of messages) {
        if (!message.id) continue;
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = msg.data.payload?.headers || [];
        const from = headers.find(header => header.name === 'From')?.value;
        const subject = headers.find(header => header.name === 'Subject')?.value;
        const date = headers.find(header => header.name === 'Date')?.value;

        emailDetails.push({
          Sender: from,
          Subject: subject,
          Date: date,
        });
      }

      res.json(emailDetails);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ error: 'Failed to authenticate or fetch emails', details: error.message });
    }
  });

  app.post('/api/send-otp', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    console.log('------------------------------------------');
    console.log('📧 SIMULATED EMAIL SENT TO:', email);
    console.log('OTP CODE:', code);
    console.log('------------------------------------------');
  
    res.json({ success: true, message: 'OTP sent successfully (Simulated)' });
  });

  app.post('/api/chat', async (req, res) => {
    const { messages, model } = req.body;
    if (!messages) return res.status(400).json({ error: 'Messages required' });
    
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: model || 'llama-3.3-70b-versatile',
      });
      res.json(chatCompletion.choices[0].message);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to chat' });
    }
  });

  // JSON 404 for unmatched API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
