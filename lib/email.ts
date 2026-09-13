import nodemailer from 'nodemailer';

export interface EmailResult {
  success: boolean;
  mode: 'live' | 'simulation' | 'failed';
  email: string;
  messageId?: string;
  otpCode?: string;
  error?: string;
}

export async function sendRealEmailOtp(toEmail: string, otpCode: string): Promise<EmailResult> {
  const cleanToEmail = toEmail.trim().toLowerCase();

  // 1. Environment Configurations
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const brevoSmtpKey = (process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS || '').trim();
  const smtpLogin = (process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER || '').trim();
  const host = (process.env.SMTP_HOST || 'smtp-relay.brevo.com').trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const pass = (process.env.SMTP_PASS || brevoSmtpKey).trim();

  // Verified sender email (must match Brevo / Domain configuration)
  const verifiedSenderEmail = (
    process.env.SMTP_VERIFIED_SENDER ||
    process.env.BREVO_SENDER_EMAIL ||
    (process.env.SMTP_USER && process.env.SMTP_USER.includes('@') && !process.env.SMTP_USER.endsWith('@smtp-brevo.com')
      ? process.env.SMTP_USER
      : 'vikashkumar902743@gmail.com')
  ).trim();

  const fromName = (process.env.SMTP_FROM_NAME || 'NoteMart Verification').trim();

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
          .logo { text-align: center; margin-bottom: 24px; }
          .logo-box { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; font-size: 22px; font-weight: 900; padding: 10px 20px; border-radius: 14px; letter-spacing: 0.5px; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 8px; }
          .subtitle { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 28px; line-height: 1.5; }
          .otp-box { background: linear-gradient(180deg, #f8fafc, #f1f5f9); border: 2px dashed #6366f1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
          .otp-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; margin-bottom: 8px; }
          .otp-code { font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #4f46e5; font-family: monospace; line-height: 1; }
          .expiry { font-size: 13px; color: #d97706; margin-top: 12px; font-weight: 700; display: inline-block; }
          .security-note { font-size: 12px; color: #64748b; text-align: center; margin-bottom: 24px; line-height: 1.6; }
          .footer { border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <div class="logo-box">NoteMart</div>
          </div>
          <h2 class="title">Verify Your NoteMart Account</h2>
          <p class="subtitle">Enter the 6-digit One-Time Password below to complete your login or registration.</p>
          
          <div class="otp-box">
            <div class="otp-label">One-Time Verification Code</div>
            <div class="otp-code">${otpCode}</div>
            <div class="expiry">⏱️ Valid for 5 minutes</div>
          </div>

          <p class="security-note">
            ⚠️ Never share this OTP with anyone. NoteMart staff will never ask for your verification code.
          </p>

          <div class="footer">
            <p>Sent by <strong>NoteMart Student Marketplace</strong><br>
            If you did not request this verification code, please ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  let lastError = '';

  // ---------------------------------------------------------------------------
  // 1. Resend REST API (Pure HTTPS fetch, ideal for Vercel serverless)
  // ---------------------------------------------------------------------------
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || `${fromName} <onboarding@resend.dev>`,
          to: [cleanToEmail],
          subject: `🔐 ${otpCode} is your NoteMart verification code`,
          html: htmlTemplate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[RESEND API SUCCESS] Sent OTP to ${cleanToEmail} (ID: ${data.id})`);
        return { success: true, mode: 'live', email: cleanToEmail, messageId: data.id };
      } else {
        const errorText = await res.text();
        lastError = `Resend API (${res.status}): ${errorText}`;
        console.warn(`[RESEND API WARNING]`, lastError);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Resend API network error';
      console.warn(`[RESEND API FETCH ERROR]`, err);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Brevo Transactional Email v3 REST API (Pure HTTPS fetch)
  // ---------------------------------------------------------------------------
  // Brevo v3 REST API requires key starting with xkeysib-
  const restApiKey = brevoApiKey.startsWith('xkeysib-')
    ? brevoApiKey
    : pass.startsWith('xkeysib-')
    ? pass
    : '';

  if (restApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': restApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: verifiedSenderEmail },
          to: [{ email: cleanToEmail }],
          subject: `🔐 Your NoteMart Verification OTP is ${otpCode}`,
          htmlContent: htmlTemplate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[BREVO API SUCCESS] Sent OTP ${otpCode} to ${cleanToEmail} (MessageId: ${data.messageId})`);
        return { success: true, mode: 'live', email: cleanToEmail, messageId: data.messageId };
      } else {
        const errorText = await response.text();
        lastError = `Brevo REST API (${response.status}): ${errorText}`;
        console.warn(`[BREVO API WARNING] ${lastError}. Falling back to SMTP...`);
      }
    } catch (apiErr: unknown) {
      lastError = apiErr instanceof Error ? apiErr.message : 'Brevo REST API error';
      console.warn(`[BREVO API FETCH ERROR]`, apiErr);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Nodemailer SMTP (Brevo Relay / Gmail / Custom SMTP)
  // ---------------------------------------------------------------------------
  if (host && smtpLogin && pass) {
    const isGmail = host.includes('gmail.com') || (smtpLogin.includes('@gmail.com') && !pass.startsWith('xsmtpsib-'));

    // Try primary port (587) then fallback to SSL port (465) if connection drops
    const portsToTry = isGmail ? [465] : [port, port === 587 ? 465 : 587];

    for (const currentPort of portsToTry) {
      try {
        const transporter = isGmail
          ? nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: smtpLogin.replace(/\s+/g, ''),
                pass: pass.replace(/\s+/g, ''),
              },
              connectionTimeout: 8000,
              greetingTimeout: 8000,
              socketTimeout: 10000,
            })
          : nodemailer.createTransport({
              host,
              port: currentPort,
              secure: currentPort === 465,
              auth: {
                user: smtpLogin.trim(),
                pass: pass.trim(),
              },
              connectionTimeout: 8000,
              greetingTimeout: 8000,
              socketTimeout: 10000,
            });

        const info = await transporter.sendMail({
          from: `"${fromName}" <${verifiedSenderEmail}>`,
          to: cleanToEmail,
          subject: `🔐 Your NoteMart Verification OTP is ${otpCode}`,
          html: htmlTemplate,
        });

        console.log(`[SMTP SUCCESS] (Port ${currentPort}) Sent Real Email OTP ${otpCode} to ${cleanToEmail} (${info.messageId})`);
        return { success: true, mode: 'live', email: cleanToEmail, messageId: info.messageId };
      } catch (smtpErr: unknown) {
        const errMsg = smtpErr instanceof Error ? smtpErr.message : 'SMTP dispatch error';
        lastError = `SMTP (Port ${currentPort}): ${errMsg}`;
        console.warn(`[SMTP ATTEMPT FAILED] (Port ${currentPort}): ${errMsg}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Fallback Mode
  // ---------------------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  console.log(`\n======================================================`);
  console.log(`[OTP DISPATCH STATUS] Target: ${cleanToEmail}`);
  console.log(`[VERIFICATION CODE]: ${otpCode}`);
  console.log(`[ENVIRONMENT]: ${isProduction ? 'PRODUCTION / VERCEL' : 'LOCAL DEV'}`);
  console.log(`[LAST ERROR / REASON]: ${lastError || 'No live email credentials configured'}`);
  console.log(`======================================================\n`);

  if (isProduction) {
    return {
      success: false,
      mode: 'failed',
      email: cleanToEmail,
      otpCode,
      error:
        lastError ||
        'Email service not configured. Please add BREVO_SMTP_LOGIN, SMTP_PASS, and SMTP_VERIFIED_SENDER in your Vercel Project Settings.',
    };
  }

  return {
    success: true,
    mode: 'simulation',
    email: cleanToEmail,
    otpCode,
  };
}
