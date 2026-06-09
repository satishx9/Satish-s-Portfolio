import { Resend } from 'resend';

let resendClient;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
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

  const resend = getResend();
  if (!resend) {
    return res.status(503).json({
      error: 'Email not configured',
      message: 'Set RESEND_API_KEY in a .env file or environment to enable the contact form.',
    });
  }

  const { first_name, last_name, email, phone, service, message } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !email || !message) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'First name, last name, email, and message are required'
    });
  }

  try {
    // 1️⃣ Email TO YOU (admin)
    await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: ['ereny7796@gmail.com'],
      subject: 'New Contact Form Message',
      html: `
        <h2>New Message</h2>
        <p><b>Name:</b> ${first_name} ${last_name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Service:</b> ${service}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    // 2️⃣ Auto-reply TO USER
    await resend.emails.send({
      from: 'Satish <onboarding@resend.dev>',
      to: [email],
      subject: 'Thanks for contacting me!',
      html: `
        <p>Hi ${first_name},</p>
        <p>Thank you for reaching out. I have received your message and will get back to you soon.</p>
        <p><b>Your message:</b></p>
        <blockquote>${message}</blockquote>
        <p>Best regards,<br/>Satish</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend API Error:', error);
    res.status(500).json({ 
      error: 'Email failed',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}