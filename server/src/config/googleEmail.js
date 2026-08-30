/**
 * Gmail API email transport using OAuth2 (Google Cloud Console credentials).
 *
 * Required .env variables:
 *   GOOGLE_CLIENT_ID       - OAuth2 Client ID from GCP Credentials page
 *   GOOGLE_CLIENT_SECRET   - OAuth2 Client Secret from GCP Credentials page
 *   GOOGLE_REDIRECT_URI    - Usually https://developers.google.com/oauthplayground
 *                            (or your own redirect URI used when generating the refresh token)
 *   GOOGLE_REFRESH_TOKEN   - Long-lived refresh token obtained once via OAuth consent
 *   GOOGLE_GMAIL_SENDER    - The Gmail address that will appear as the sender (must be the
 *                            same Google account that generated the refresh token)
 *
 * See /README.md "Gmail OAuth2 Setup" section for step-by-step instructions on
 * generating GOOGLE_REFRESH_TOKEN using the OAuth Playground.
 */

import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_GMAIL_SENDER,
} = process.env;

let cachedTransporter = null;

/**
 * Builds (and caches) a nodemailer transporter authenticated against the Gmail API
 * via OAuth2. A fresh access token is requested from Google using the refresh token
 * on every call, since access tokens are short-lived (~1hr) and this keeps the
 * transporter working indefinitely without manual intervention.
 */
export const getGmailTransporter = async () => {
  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REFRESH_TOKEN ||
    !GOOGLE_GMAIL_SENDER
  ) {
    throw new Error(
      'Gmail OAuth2 credentials are not fully configured. Check GOOGLE_CLIENT_ID, ' +
        'GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN, GOOGLE_GMAIL_SENDER in .env'
    );
  }

  const oAuth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
  );

  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  const { token: accessToken } = await oAuth2Client.getAccessToken();

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GOOGLE_GMAIL_SENDER,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
  });

  return cachedTransporter;
};

export default getGmailTransporter;
