import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import http from 'node:http';
import { URL } from 'node:url';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export async function authorize(): Promise<OAuth2Client> {
  let client_id = process.env.GOOGLE_CLIENT_ID;
  let client_secret = process.env.GOOGLE_CLIENT_SECRET;

  const credPath = path.resolve(process.cwd(), 'credentials.json');
  if (fs.existsSync(credPath)) {
    const content = fs.readFileSync(credPath, 'utf8');
    const credentials = JSON.parse(content);
    const creds = credentials.installed || credentials.web;
    client_id = client_id || creds.client_id;
    client_secret = client_secret || creds.client_secret;
  }

  if (!client_id || !client_secret) {
    throw new Error(
      'OAuth credentials not found. Please provide credentials.json or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
    );
  }

  return executeLoopbackFlow(client_id, client_secret);
}

async function executeLoopbackFlow(clientId: string, clientSecret: string): Promise<OAuth2Client> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) return;
        
        const address = server.address();
        if (!address || typeof address === 'string') return;
        
        const port = address.port;
        const url = new URL(req.url, `http://127.0.0.1:${port}`);
        
        if (url.pathname !== '/') {
          res.writeHead(404);
          res.end();
          return;
        }

        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end(`Authorization failed: ${error}`);
          server.close();
          return reject(new Error(`Authorization failed: ${error}`));
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Authentication successful! You can close this window and return to the terminal.');
          server.close();

          const oAuth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            `http://127.0.0.1:${port}`
          );

          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          oAuth2Client.on('tokens', (newTokens) => {
            oAuth2Client.setCredentials(newTokens);
          });
          
          resolve(oAuth2Client);
        }
      } catch (e) {
        reject(e);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        return reject(new Error('Failed to start loopback server.'));
      }
      
      const port = address.port;
      const redirectUri = `http://127.0.0.1:${port}`;

      const oAuth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });

      console.log(`\nPlease open the following URL in your browser to authorize the application:\n`);
      console.log(authUrl);
      console.log(`\nWaiting for authorization on ${redirectUri}...`);
    });

    server.on('error', (e) => {
      reject(e);
    });
  });
}
