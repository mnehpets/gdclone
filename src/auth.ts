import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export async function authorize(): Promise<OAuth2Client> {
  const credPath = path.resolve(process.cwd(), 'credentials.json');
  if (!fs.existsSync(credPath)) {
    throw new Error('credentials.json not found in the current directory. Please follow the setup instructions in the README.');
  }

  const content = fs.readFileSync(credPath, 'utf8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris ? redirect_uris[0] : 'urn:ietf:wg:oauth:2.0:oob'
  );

  return new Promise((resolve, reject) => {
    oAuth2Client.on('tokens', (tokens) => {
      oAuth2Client.setCredentials(tokens);
    });

    // Implement Device Flow manually as google-auth-library might not expose it easily
    executeDeviceFlow(client_id, client_secret).then(tokens => {
        oAuth2Client.setCredentials(tokens);
        resolve(oAuth2Client);
    }).catch(reject);
  });
}

async function executeDeviceFlow(clientId: string, clientSecret: string) {
  const res = await fetch('https://oauth2.googleapis.com/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      scope: SCOPES.join(' '),
    }),
  });

  const data: any = await res.json();
  if (data.error) {
    throw new Error(`Device flow error: ${data.error_description || data.error}`);
  }

  console.log(`\nPlease visit this URL: ${data.verification_url}`);
  console.log(`And enter the following code: ${data.user_code}\n`);

  let intervalMs = data.interval * 1000;
  const deviceCode = data.device_code;

  while (true) {
    await new Promise(r => setTimeout(r, intervalMs));
    
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const tokenData: any = await tokenRes.json();
    if (tokenData.error) {
      if (tokenData.error === 'authorization_pending') {
        continue;
      } else if (tokenData.error === 'slow_down') {
        intervalMs += 2000;
        continue;
      } else {
        throw new Error(`Token polling error: ${tokenData.error_description || tokenData.error}`);
      }
    }

    return tokenData;
  }
}
