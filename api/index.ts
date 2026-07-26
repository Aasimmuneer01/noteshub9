import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import Groq from 'groq-sdk';
import { google } from 'googleapis';

const app = express();

app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Routing is working' });
});

app.get('/api/test-gmail', async (req, res) => {
  return res.json({
    clientIdPresent: !!process.env.GMAIL_CLIENT_ID,
    clientSecretPresent: !!process.env.GMAIL_CLIENT_SECRET,
    refreshTokenPresent: !!process.env.GMAIL_REFRESH_TOKEN,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecretLength: process.env.GMAIL_CLIENT_SECRET ? process.env.GMAIL_CLIENT_SECRET.length : 0,
    refreshTokenLength: process.env.GMAIL_REFRESH_TOKEN ? process.env.GMAIL_REFRESH_TOKEN.length : 0
  });
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
      
  if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
          error: "Missing GROQ_API_KEY"
      });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

export default app;
