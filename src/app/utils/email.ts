import { env } from "cloudflare:workers";
import { requestInfo } from "rwsdk/worker";

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  const { request } = requestInfo;
  
  // Get the email binding from the environment
  const emailSender = env.EMAIL_SENDER;
  
  if (!emailSender) {
    console.error("Email sender not configured");
    return false;
  }
  
  try {
    const message = {
      from: env.EMAIL_FROM || "noreply@example.com",
      to,
      subject,
      html: htmlContent
    };
    
    await emailSender.send(message);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function generatePasswordResetEmail(username: string, resetLink: string) {
  return `
    <html>
      <body>
        <h1>Password Reset</h1>
        <p>Hello ${username},</p>
        <p>You requested a password reset for your account. Click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
    </html>
  `;
}