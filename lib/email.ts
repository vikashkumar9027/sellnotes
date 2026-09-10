import nodemailer from 'nodemailer';

export async function sendRealEmailOtp(toEmail: string, otpCode: string) {
  const brevoApiKey = process.env.BREVO_API_KEY || '';
  const brevoSmtpKey = process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS || '';

  // Dedicated Brevo SMTP login is in the format xxx@smtp-brevo.com
  const smtpLogin = process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER || '';
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const pass = process.env.SMTP_PASS || brevoSmtpKey;

  // The verified sender on Brevo/Gmail must match the registered email
  const verifiedSenderEmail =
    process.env.SMTP_VERIFIED_SENDER ||
    (process.env.SMTP_USER && process.env.SMTP_USER.includes('@') && !process.env.SMTP_USER.endsWith('@smtp-brevo.com')
      ? process.env.SMTP_USER
      : 'vikashkumar9027@gmail.com');
  const fromName = process.env.SMTP_FROM_NAME || 'NoteMart Verification';

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
          .logo { text-align: center; margin-bottom: 24px; }
          .logo-box { display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 22px; font-weight: 900; padding: 8px 16px; border-radius: 12px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 8px; }
          .subtitle { font-size: 13px; color: #64748b; text-align: center; margin-bottom: 24px; }
          .otp-box { background-color: #f1f5f9; border: 2px dashed #6366f1; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
          .footer { border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <div class="logo-box">NoteMart</div>
          </div>
          <h2 class="title">Email OTP Verification</h2>
          <p class="subtitle">Use the 6-digit One-Time Password below to complete your verification.</p>
          
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="expiry">⏱️ Valid for 5 minutes. Do not share with anyone.</div>
          </div>

          <div class="footer">
            <p>This automated message was sent by NoteMart Student Notes Marketplace.<br>If you did not request this OTP, please ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Try Brevo Transactional Email v3 REST API (Works when key starts with xkeysib-)
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
          'accept': 'application/json',
          'api-key': restApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: verifiedSenderEmail },
          to: [{ email: toEmail }],
          subject: `🔐 Your NoteMart Verification OTP is ${otpCode}`,
          htmlContent: htmlTemplate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[BREVO API SUCCESS] Live OTP Email ${otpCode} sent to ${toEmail} (MessageId: ${data.messageId})`);
        return { success: true, mode: 'live', email: toEmail, messageId: data.messageId };
      } else {
        const errorText = await response.text();
        console.warn(`[BREVO API WARNING] ${response.status}: ${errorText}. Falling back to SMTP...`);
      }
    } catch (apiErr) {
      console.warn(`[BREVO API FETCH ERROR] Falling back to SMTP:`, apiErr);
    }
  }

  // 2. Nodemailer SMTP (Gmail, Brevo SMTP Relay, or Custom SMTP)
  if (host && smtpLogin && pass) {
    try {
      const isGmail = host.includes('gmail.com') || (smtpLogin.includes('@gmail.com') && !pass.startsWith('xsmtpsib-'));
      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpLogin.replace(/\s+/g, ''),
              pass: pass.replace(/\s+/g, ''),
            },
          })
        : nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
              user: smtpLogin.trim(),
              pass: pass.trim(),
            },
          });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${verifiedSenderEmail}>`,
        to: toEmail,
        subject: `🔐 Your NoteMart Verification OTP is ${otpCode}`,
        html: htmlTemplate,
      });

      console.log(`[SMTP SUCCESS] Sent Real Email OTP ${otpCode} to ${toEmail} (${info.messageId})`);
      return { success: true, mode: 'live', email: toEmail, messageId: info.messageId };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'SMTP dispatch error';
      console.error(`[SMTP ERROR] Failed to send email to ${toEmail}: ${errorMessage}`);
    }
  }

  // 3. Fallback Simulation Mode (Logged to Terminal for development)
  console.log(`\n======================================================`);
  console.log(`[OTP LOCAL DEV SIMULATION] Target: ${toEmail}`);
  console.log(`[VERIFICATION CODE]: ${otpCode} (Valid for 5 mins)`);
  console.log(`[REASON]: Live email dispatch pending valid credentials.`);
  console.log(`======================================================\n`);

  return {
    success: true,
    mode: 'simulation',
    email: toEmail,
    otpCode,
  };
}
