import fs from 'fs';
import http from 'http';
import { URL } from 'url';
import { google } from 'googleapis';
import open from 'open';

const CREDENTIALS_PATH = 'client_secret_115956866102-hatt2pudbdnpaloalk6t5d5sjujhlshn.apps.googleusercontent.com.json';

async function main() {
  let credentials;
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    credentials = JSON.parse(content);
  } catch (err) {
    console.error(`Error reading credentials file: ${CREDENTIALS_PATH}`);
    process.exit(1);
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  let redirectUri = 'http://localhost:3001';
  if (redirect_uris && redirect_uris.length > 0) {
    const localhostUri = redirect_uris.find(u => u.startsWith('http://localhost:3001'));
    if (localhostUri) {
      redirectUri = localhostUri;
    }
  }

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
  });

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url, `http://localhost:3001`);
      const code = reqUrl.searchParams.get('code');
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication successful! You can close this tab.</h1>');
        
        const { tokens } = await oAuth2Client.getToken(code);
        if (tokens.refresh_token) {
          console.log(`\nGMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
        } else {
          console.log('\nNo refresh token received. (Make sure you used prompt=consent)\n');
        }
        
        server.close(() => {
          process.exit(0);
        });
      } else {
        if (reqUrl.pathname !== '/favicon.ico') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Waiting for authorization...</h1>');
        } else {
          res.writeHead(404);
          res.end();
        }
      }
    } catch (e) {
      console.error('Error exchanging token:', e);
      res.writeHead(500);
      res.end('Error occurred.');
    }
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error('Error: Port 3001 is already in use. Please free up port 3001 to run this script.');
      process.exit(1);
    } else {
      console.error(e);
      process.exit(1);
    }
  });

  server.listen(3001, async () => {
    console.log(`Server is running on port 3001.`);
    console.log(`IMPORTANT: Ensure that http://localhost:3001 is added to your OAuth 2.0 Authorized redirect URIs in Google Cloud Console.`);
    console.log(`Opening browser to authorize...`);
    console.log(`If it doesn't open automatically, please click this link:\n\n${authorizeUrl}\n`);
    try {
      await open(authorizeUrl);
    } catch (e) {
      // Ignore open errors
    }
  });
}

main();
