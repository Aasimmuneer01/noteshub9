import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import Groq from 'groq-sdk';
import { google } from 'googleapis';
import { updateAnalytics, logEmail, logPendingReview } from './analytics.js';

const app = express();

app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

async function handleReplyEmails(req: any, res: any) {
  if (req.path === '/api/test-reply-latest-email') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token || token !== process.env.CRON_SECRET) {
      console.error('CRON_SECRET validation failed');
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log('CRON_SECRET validation passed');
  }

  const missing = [];
  if (!process.env.GMAIL_CLIENT_ID) missing.push('GMAIL_CLIENT_ID');
  if (!process.env.GMAIL_CLIENT_SECRET) missing.push('GMAIL_CLIENT_SECRET');
  if (!process.env.GMAIL_REFRESH_TOKEN) missing.push('GMAIL_REFRESH_TOKEN');
  if (!process.env.GROQ_API_KEY) missing.push('GROQ_API_KEY');

  console.log('Environment check:', {
    GMAIL_CLIENT_ID: !!process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: !!process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: !!process.env.GMAIL_REFRESH_TOKEN,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY
  });
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
    console.log('Gmail OAuth client initialized');

    console.log('GMAIL_REFRESH_TOKEN exists:', !!process.env.GMAIL_REFRESH_TOKEN);
    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      scope: 'https://www.googleapis.com/auth/gmail.modify',
    });
    console.log('Refreshing access token...');
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);
    console.log('Access token refreshed successfully');

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    
    console.log('Attempting to get Gmail profile...');
    const profileRes = await gmail.users.getProfile({ userId: 'me' });
    console.log('Gmail profile received.');
    const myEmail = profileRes.data.emailAddress?.toLowerCase() || '';

    console.log('Listing unread messages...');
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'in:inbox is:unread',
    });

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} messages.`);
    const ignoredSenders = ['noreply', 'no-reply', 'google', 'github', 'firebase', 'newsletters', 'newsletter', 'automated', 'promotional'];

    for (const msg of messages) {
      if (!msg.id) continue;
      checked++;
      await updateAnalytics('received');

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

        try {
            console.log('Sending prompt to Groq for message', msg.id, '...');
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const chatCompletion = await groq.chat.completions.create({
              messages: [
                {
                  role: "system",
                              content: `You are the official AI customer support assistant for NotesHub9.
    
    Website:
    https://noteshub9.vercel.app
    
    About:
    NotesHub9 is a free educational platform for students.
    
    Features:
    
    - Study Notes
    - PDF Downloads
    - JKBOSE Resources
    - NCERT Resources
    - Previous Year Papers
    - Important Questions
    - Class-wise Resources
    - Educational Materials
    
    The AI should be able to answer questions about:
    
    - Website usage
    - Download problems
    - Missing notes
    - Broken links
    - Bug reports
    - Feature requests
    - User feedback
    
    Rules:
    
    - Always be polite.
    - Never invent information.
    - Never guess.
    - If the information is unknown, reply:
    
    "I don't currently have that information. Your request has been forwarded to the NotesHub9 Team."
    
    If the website is reported as down, reply:
    
    "Thank you for informing us. Our team has been notified and is working to restore the service as quickly as possible."
    
    Never tell users to check social media unless explicitly instructed.
    
    Always sign replies:
    
    Best regards,
    
    NotesHub9 AI Support
    
    IMPORTANT: Provide your response in the following format:
    Reply:
    [Your reply body here]
    Confidence: [Confidence Score 0-10]`
                },
                {
                  role: "user",
                  content: `Email from: ${fromHeader}\nSubject: ${subjectHeader}\n\n${plainTextBody}`
                }
              ],
              model: 'llama3-8b-8192',
            });
            console.log('Groq completion received for message', msg.id);
            
            const replyContent = chatCompletion.choices[0]?.message?.content || '';
            const confidenceMatch = replyContent.match(/Confidence:\s*(\d+)/i);
            const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0;
            const replyBodyMatch = replyContent.match(/Reply:\s*([\s\S]*?)Confidence:/i);
            let replyBody = replyBodyMatch ? replyBodyMatch[1].trim() : replyContent;
    
            if (confidence <= 7) {
                replyBody = `Thank you for contacting NotesHub9.
    
    Your request requires manual review by our support team.
    
    We have forwarded your message to the NotesHub9 Team and they will respond as soon as possible.
    
    Best regards,
    
    NotesHub9 AI Support`;
                await logPendingReview(msg.id, `Confidence: ${confidence}`);
                console.log('Logged pending review for message', msg.id);
            }
            
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
    
            console.log('Sending reply email for message', msg.id, '...');
            await gmail.users.messages.send({
              userId: 'me',
              requestBody: {
                raw: base64EncodedEmail,
                threadId: threadId,
              },
            });
            console.log('Reply email sent for message', msg.id);
    
            replied++;
            await updateAnalytics('replied');
            await logEmail(msg.id, 'success');
            console.log('Logged email success for message', msg.id);
        } catch (groqErr) {
            console.error('Error during AI processing/sending for message', msg.id, groqErr);
            throw groqErr; // Re-throw to be caught by outer try-catch
        }
      } catch (err) {
        console.error('Error processing message:', err);
        errors++;
        await updateAnalytics('failed');
        await logEmail(msg.id, 'failed', err instanceof Error ? err.message : String(err));
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

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY not configured" });
        }
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful AI assistant for NotesHub9." },
                ...messages
            ],
            model: 'llama3-8b-8192',
        });
        
        const content = chatCompletion.choices[0]?.message?.content || 'No response';
        res.json({ content });
    } catch (err) {
        console.error('Error in chat:', err);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

app.get('/api/cron/reply-emails', handleReplyEmails);
app.post('/api/reply-latest-email', handleReplyEmails);
app.get('/api/test-reply-latest-email', handleReplyEmails);

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

export default app;
