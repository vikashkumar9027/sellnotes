import nodemailer from 'nodemailer';

export async function sendRealEmailOtp(toEmail: string, otpCode: string) {
  const brevoApiKey =
    process.env.BREVO_API_KEY ||
    process.env.SMTP_PASS;

  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || 'vikashkumar9027@gmail.com';
  const pass = process.env.SMTP_PASS || brevoApiKey;
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'support@notemart.edu';
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

  // 1. Try Brevo Transactional Email v3 API first (fastest & reliable on Vercel/Render)
  if (brevoApiKey && brevoApiKey.startsWith('xsmtpsib-')) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: user || 'vikashkumar9027@gmail.com' },
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
        console.warn(`[BREVO API WARNING] ${response.status}: ${errorText}. Falling back to Nodemailer SMTP...`);
      }
    } catch (apiErr) {
      console.warn(`[BREVO API FETCH ERROR] Falling back to Nodemailer SMTP:`, apiErr);
    }
  }

  // 2. Nodemailer SMTP Fallback
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject: `🔐 Your NoteMart Verification OTP is ${otpCode}`,
        html: htmlTemplate,
      });

      console.log(`[SMTP SUCCESS] Sent Real Email OTP ${otpCode} to ${toEmail}`);
      return { success: true, mode: 'live', email: toEmail };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'SMTP dispatch error';
      console.error(`[SMTP ERROR] Failed to send email to ${toEmail}: ${errorMessage}`);
    }
  }

  // 3. Fallback Simulation Mode (Terminal Log)
  console.log(`\n======================================================`);
  console.log(`[OTP SIMULATION MODE] Target Email: ${toEmail}`);
  console.log(`[REAL OTP GENERATED]: ${otpCode}`);
  console.log(`======================================================\n`);

  return {
    success: true,
    mode: 'simulation',
    email: toEmail,
    otpCode,
  };
}
