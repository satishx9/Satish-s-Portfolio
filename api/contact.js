import nodemailer from 'nodemailer';

let transporter;
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return transporter;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  const mailer = getTransporter();
  if (!mailer) {
    return res.status(503).json({
      error: 'Email not configured',
      message: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in a .env file to enable the contact form.',
    });
  }

  const { first_name, last_name, email, phone, message } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !email || !message) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'First name, last name, email, and message are required'
    });
  }

  const gmailUser = process.env.GMAIL_USER;

  try {
    // 1️⃣ Email TO YOU (notification)
    await mailer.sendMail({
      from: `Portfolio Contact <${gmailUser}>`,
      to: gmailUser,
      replyTo: email,
      subject: `New Contact Form Message from ${first_name} ${last_name}`,
      html: `
        <h2>New Message</h2>
        <p><b>Name:</b> ${first_name} ${last_name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || 'Not provided'}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    // 2️⃣ Auto-reply TO THE SENDER
    await mailer.sendMail({
      from: `Satish Thadela <${gmailUser}>`,
      to: email,
      subject: `Thanks for reaching out, ${first_name}!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding:36px 40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                Satish Thadela
              </h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:14px; font-weight:400;">
                AI/ML Enthusiast &bull; Full Stack Developer
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <p style="margin:0 0 20px; font-size:18px; color:#1a1a2e; font-weight:600;">
                Hi ${first_name} 👋
              </p>
              <p style="margin:0 0 16px; font-size:15px; color:#444; line-height:1.7;">
                Thank you so much for reaching out! I've received your message and truly appreciate you taking the time to connect with me.
              </p>
              <p style="margin:0 0 24px; font-size:15px; color:#444; line-height:1.7;">
                I'll review your message and get back to you as soon as possible — typically within <strong>24 hours</strong>.
              </p>

              <!-- Message Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f8f7ff; border-left:4px solid #6366f1; border-radius:0 8px 8px 0; padding:20px 24px;">
                    <p style="margin:0 0 8px; font-size:12px; color:#6366f1; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                      Your Message
                    </p>
                    <p style="margin:0; font-size:14px; color:#555; line-height:1.6; font-style:italic;">
                      "${message}"
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px; font-size:15px; color:#444; line-height:1.7;">
                In the meantime, feel free to check out my work:
              </p>
            </td>
          </tr>

          <!-- Links -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="https://github.com/satishx9" target="_blank" style="display:inline-block; padding:10px 20px; background:#24292e; color:#ffffff; text-decoration:none; border-radius:6px; font-size:13px; font-weight:600;">
                      GitHub
                    </a>
                  </td>
                  <td>
                    <a href="https://www.linkedin.com/in/satishthadela" target="_blank" style="display:inline-block; padding:10px 20px; background:#0A66C2; color:#ffffff; text-decoration:none; border-radius:6px; font-size:13px; font-weight:600;">
                      LinkedIn
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:24px 40px; border-top:1px solid #eee; text-align:center;">
              <p style="margin:0 0 4px; font-size:14px; color:#1a1a2e; font-weight:600;">
                Satish Thadela
              </p>
              <p style="margin:0; font-size:12px; color:#999; line-height:1.5;">
                Hyderabad, India &bull; thadelasatish@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({
      error: 'Email failed',
      message: error.message || 'Unknown error occurred',
    });
  }
}