import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store — good enough for MVP
const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(email, { otp, expiresAt });

  try {
    await resend.emails.send({
      from: 'StudentSolve <noreply@studentsolve.com>',
      to: email,
      subject: 'Your StudentSolve verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0d0d0f; color: #f0ede6;">
          <h1 style="font-size: 1.5rem; margin-bottom: 8px; color: #f0ede6;">StudentSolve</h1>
          <p style="color: #a09e9a; margin-bottom: 32px;">Verify your email to create your account.</p>
          
          <div style="background: #1e1e24; border: 1px solid #2a2a33; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="color: #a09e9a; font-size: 0.85rem; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Your verification code</p>
            <div style="font-size: 2.5rem; font-weight: 700; letter-spacing: 0.2em; color: #c8a96e;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #5e5c58; font-size: 0.82rem;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Verification code sent.' });
  } catch (err) {
    console.error('[OTP Error]', err.message);
    res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ error: 'No verification code found for this email. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
  }

  if (record.otp !== otp.toString()) {
    return res.status(400).json({ error: 'Incorrect code. Please try again.' });
  }

  otpStore.delete(email);
  res.json({ success: true, message: 'Email verified.' });
}