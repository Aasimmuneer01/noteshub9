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
  console.log('GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? 'Present' : 'Missing');
  console.log('GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? 'Present' : 'Missing');
  console.log('GMAIL_REFRESH_TOKEN:', process.env.GMAIL_REFRESH_TOKEN ? 'Present' : 'Missing');

  const missing = [];
  if (!process.env.GMAIL_CLIENT_ID) missing.push('GMAIL_CLIENT_ID');
  if (!process.env.GMAIL_CLIENT_SECRET) missing.push('GMAIL_CLIENT_SECRET');
  if (!process.env.GMAIL_REFRESH_TOKEN) missing.push('GMAIL_REFRESH_TOKEN');

  if (missing.length > 0) {
    return res.status(500).json({ error: `Missing environment variables: ${missing.join(', ')}` });
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "http://localhost:3000/oauth2callback"
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
      const from = headers.find((header: any) => header.name === 'From')?.value;
      const subject = headers.find((header: any) => header.name === 'Subject')?.value;
      const date = headers.find((header: any) => header.name === 'Date')?.value;

      emailDetails.push({
        Sender: from,
        Subject: subject,
        Date: date,
      });
    }

    res.json(emailDetails);
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      message: error.message,
      response: error.response?.data || null,
      stack: error.stack,
    });
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
