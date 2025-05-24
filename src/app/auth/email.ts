import { Resend } from 'resend';
import { env } from "cloudflare:workers";
import { CONSTANTS } from "@/app/shared/constants";

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  // Check if Resend API key is configured
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured in environment variables");
    return false;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: CONSTANTS.FROM_EMAIL,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("Email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function generatePasswordResetEmail(username: string, resetLink: string) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hello <strong>${username}</strong>,</p>
          <p>You requested a password reset for your ILCA KNS account. Click the button below to reset your password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
            <a href="${resetLink}">${resetLink}</a>
          </p>

          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Best regards,<br>
            The ILCA KNS Team
          </p>
        </div>
      </body>
    </html>
  `;
}