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

async function handleReplyEmails(req: any, res: any) {
  const missing = [];
  if (!process.env.GMAIL_CLIENT_ID) missing.push('GMAIL_CLIENT_ID');
  if (!process.env.GMAIL_CLIENT_SECRET) missing.push('GMAIL_CLIENT_SECRET');
  if (!process.env.GMAIL_REFRESH_TOKEN) missing.push('GMAIL_REFRESH_TOKEN');
  if (!process.env.GROQ_API_KEY) missing.push('GROQ_API_KEY');

  if (missing.length > 0) {
    return res.status(500).json({ error: `Missing environment variables: ${missing.join(', ')}` });
  }

  let checked = 0;
  let replied = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.APP_URL ? `${process.env.APP_URL}/oauth2callback` : "http://localhost:3000/oauth2callback"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    
    const profileRes = await gmail.users.getProfile({ userId: 'me' });
    const myEmail = profileRes.data.emailAddress?.toLowerCase() || '';

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'in:inbox is:unread',
    });

    const messages = response.data.messages || [];
    const ignoredSenders = ['noreply', 'no-reply', 'google', 'github', 'firebase', 'newsletters', 'newsletter', 'automated', 'promotional'];

    for (const msg of messages) {
      if (!msg.id) continue;
      checked++;

      try {
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });
        
        const headers = fullMsg.data.payload?.headers || [];
        const fromHeader = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
        const fromLower = fromHeader.toLowerCase();
        
        const isIgnored = ignoredSenders.some(ignored => fromLower.includes(ignored));
        if (isIgnored) {
          skipped++;
          continue;
        }

        // Check if we already replied by looking at the thread
        const threadId = fullMsg.data.threadId;
        if (threadId) {
          const threadRes = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
            format: 'metadata',
            metadataHeaders: ['From', 'Message-ID', 'In-Reply-To']
          });
          
          const threadMessages = threadRes.data.messages || [];
          const customerMsgIndex = threadMessages.findIndex(m => m.id === msg.id);
          
          let alreadyReplied = false;
          if (customerMsgIndex !== -1) {
            for (let i = customerMsgIndex + 1; i < threadMessages.length; i++) {
              const replyMsg = threadMessages[i];
              const replyHeaders = replyMsg.payload?.headers || [];
              const replyFrom = replyHeaders.find(h => h.name?.toLowerCase() === 'from')?.value || '';
              if (replyFrom.toLowerCase().includes(myEmail)) {
                alreadyReplied = true;
                break;
              }
            }
          }
          
          if (alreadyReplied) {
            skipped++;
            continue;
          }
        }

        const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
        const messageIdHeader = headers.find((h: any) => h.name?.toLowerCase() === 'message-id')?.value || '';
        const referencesHeader = headers.find((h: any) => h.name?.toLowerCase() === 'references')?.value || '';

        let plainTextBody = '';
        const getPlainText = (payload: any) => {
          if (!payload) return;
          if (payload.mimeType === 'text/plain' && payload.body?.data) {
            plainTextBody += Buffer.from(payload.body.data, 'base64').toString('utf-8');
          } else if (payload.parts) {
            for (const part of payload.parts) {
              getPlainText(part);
            }
          }
        };
        getPlainText(fullMsg.data.payload);

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are the official AI support assistant for NotesHub9. Reply professionally, clearly, and helpfully. Do not invent information. If you don't know something, politely say so."
            },
            {
              role: "user",
              content: `Email from: ${fromHeader}\nSubject: ${subjectHeader}\n\n${plainTextBody}`
            }
          ],
          model: 'llama-3.3-70b-versatile',
        });
        
        const replyBody = chatCompletion.choices[0]?.message?.content || 'Thank you for reaching out.';

        const subject = subjectHeader.toLowerCase().startsWith('re:') ? subjectHeader : `Re: ${subjectHeader}`;
        const to = fromHeader;

        const emailLines = [];
        emailLines.push(`To: ${to}`);
        emailLines.push(`Subject: ${subject}`);
        if (messageIdHeader) {
          emailLines.push(`In-Reply-To: ${messageIdHeader}`);
          if (referencesHeader) {
            emailLines.push(`References: ${referencesHeader} ${messageIdHeader}`);
          } else {
            emailLines.push(`References: ${messageIdHeader}`);
          }
        }
        emailLines.push('Content-Type: text/plain; charset="UTF-8"');
        emailLines.push('');
        emailLines.push(replyBody);

        const emailRaw = emailLines.join('\r\n');
        const base64EncodedEmail = Buffer.from(emailRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: base64EncodedEmail,
            threadId: threadId,
          },
        });

        replied++;
      } catch (err) {
        console.error('Error processing message:', err);
        errors++;
      }
    }

    if (req.path === '/api/reply-latest-email' || req.path === '/api/test-reply-latest-email') {
      if (replied > 0) {
        return res.json({ success: true, replySent: true, checked, skipped, errors });
      } else {
        return res.json({ message: "No unread customer emails.", checked, skipped, errors });
      }
    } else {
      return res.json({ checked, replied, skipped, errors });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.message,
      response: error.response?.data || null,
      stack: error.stack,
    });
  }
}

app.get('/api/cron/reply-emails', handleReplyEmails);
app.post('/api/reply-latest-email', handleReplyEmails);
app.get('/api/test-reply-latest-email', handleReplyEmails);

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

export default app;
