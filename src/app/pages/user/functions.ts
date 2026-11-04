"use server";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

import { sessions } from "@/session/store";
import { requestInfo } from "rwsdk/worker";
import { IS_DEV } from "rwsdk/constants";
import { db } from "@/db";
import { env } from "cloudflare:workers";
import { hashPassword, verifyPassword } from "@/app/auth/password";
import { randomBytes } from "crypto";
import { sendEmail, generatePasswordResetEmail } from "@/app/auth/email";
import { autoCreateUserProfile } from "@/app/lib/profiles";
import { requireUser } from "@/app/auth/guards";
import { z } from "zod";

function getWebAuthnConfig(request: Request) {
  const rpID = env.WEBAUTHN_RP_ID ?? new URL(request.url).hostname;
  const rpName = IS_DEV ? "Development App" : env.WEBAUTHN_APP_NAME;
  return {
    rpName,
    rpID,
  };
}

// PUBLIC: starts sign-up / adding a passkey; only stores a challenge in the session
export async function startPasskeyRegistration(username: string) {
  const { rpName, rpID } = getWebAuthnConfig(requestInfo.request);
  const headers = requestInfo.response.headers;

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
    authenticatorSelection: {
      // Require the authenticator to store the credential, enabling a username-less login experience
      residentKey: "required",
      // Prefer user verification (biometric, PIN, etc.), but allow authentication even if it's not available
      userVerification: "preferred",
    },
  });

  await sessions.save(headers, { challenge: options.challenge });

  return options;
}

// PUBLIC: sign-in
export async function startPasskeyLogin() {
  const { rpID } = getWebAuthnConfig(requestInfo.request);
  const headers = requestInfo.response.headers;

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });

  await sessions.save(headers, { challenge: options.challenge });

  return options;
}

// PUBLIC: sign-up
export async function finishPasskeyRegistration(
  username: string,
  registration: RegistrationResponseJSON,
) {
  const { request } = requestInfo;
  const headers = requestInfo.response.headers;
  const { origin } = new URL(request.url);

  const session = await sessions.load(request);
  const challenge = session?.challenge;

  if (!challenge) {
    return false;
  }

  const verification = await verifyRegistrationResponse({
    response: registration,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: env.WEBAUTHN_RP_ID || new URL(request.url).hostname,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return false;
  }

  await sessions.save(headers, { challenge: null });

  const user = await db.user.create({
    data: {
      username,
    },
  });

  await db.credential.create({
    data: {
      userId: user.id,
      credentialId: verification.registrationInfo.credential.id,
      publicKey: verification.registrationInfo.credential.publicKey,
      counter: verification.registrationInfo.credential.counter,
      deviceName: (() => {
        const userAgent = request.headers.get('user-agent') || 'Unknown Device';
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        // Extract device info from user agent
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
        const deviceType = isMobile ? 'Mobile' : 'Desktop';

        // Try to extract browser name
        let browserName = 'Browser';
        if (/Chrome/i.test(userAgent) && !/Chromium|Edge/i.test(userAgent)) browserName = 'Chrome';
        else if (/Firefox/i.test(userAgent)) browserName = 'Firefox';
        else if (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edge/i.test(userAgent)) browserName = 'Safari';
        else if (/Edge|Edg/i.test(userAgent)) browserName = 'Edge';

        return `${browserName} on ${deviceType} (${dateStr})`;
      })(),
    },
  });

  // Auto-create a basic profile for the new user
  try {
    await autoCreateUserProfile(user.id);
    console.log("Auto-created profile for new passkey user:", user.id);
  } catch (error) {
    console.error("Failed to auto-create profile for passkey user:", error);
    // Don't fail registration if profile creation fails
  }

  return true;
}

// PUBLIC: sign-in
export async function finishPasskeyLogin(login: AuthenticationResponseJSON) {
  const { request } = requestInfo;
  const headers = requestInfo.response.headers;
  const { origin } = new URL(request.url);

  const session = await sessions.load(request);
  const challenge = session?.challenge;

  if (!challenge) {
    return false;
  }

  const credential = await db.credential.findUnique({
    where: {
      credentialId: login.id,
    },
  });

  if (!credential) {
    return false;
  }

  const verification = await verifyAuthenticationResponse({
    response: login,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: env.WEBAUTHN_RP_ID || new URL(request.url).hostname,
    requireUserVerification: false,
    credential: {
      id: credential.credentialId,
      publicKey: new Uint8Array(credential.publicKey),
      counter: credential.counter,
    },
  });

  if (!verification.verified) {
    return false;
  }

  await db.credential.update({
    where: {
      credentialId: login.id,
    },
    data: {
      counter: verification.authenticationInfo.newCounter,
    },
  });

  const user = await db.user.findUnique({
    where: {
      id: credential.userId,
    },
  });

  if (!user) {
    return false;
  }

  await sessions.save(headers, {
    userId: user.id,
    challenge: null,
  });

  return true;
}

// Add email/password registration
// PUBLIC: sign-up
export async function registerWithPassword(username: string, email: string, password: string) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  // Auto-create a basic profile for the new user
  try {
    await autoCreateUserProfile(user.id);
    console.log("Auto-created profile for new password user:", user.id);
  } catch (error) {
    console.error("Failed to auto-create profile for password user:", error);
    // Don't fail registration if profile creation fails
  }

  // Set session
  await sessions.save(requestInfo.response.headers, {
    userId: user.id,
    challenge: null,
  });

  return user.id;
}

// Add email/password login
// PUBLIC: sign-in
export async function loginWithPassword(email: string, password: string) {
  // Find user
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) return false;

  // Verify password
  const isValid = verifyPassword(password, user.password);
  if (!isValid) return false;

  // Set session
  await sessions.save(requestInfo.response.headers, {
    userId: user.id,
    challenge: null,
  });

  return true;
}

// SELF: add a passkey to the signed-in user's own account.
export async function addPasskeyToExistingAccount(registration: RegistrationResponseJSON) {
  const userId = requireUser().id;
  const { request } = requestInfo;
  const headers = requestInfo.response.headers;
  const { origin } = new URL(request.url);

  const session = await sessions.load(request);
  const challenge = session?.challenge;

  if (!challenge) {
    return false;
  }

  const verification = await verifyRegistrationResponse({
    response: registration,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: env.WEBAUTHN_RP_ID || new URL(request.url).hostname,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return false;
  }

  await sessions.save(headers, { challenge: null });

  // Create credential for existing user
  await db.credential.create({
    data: {
      userId,
      credentialId: registration.id,
      publicKey: Buffer.from(
        verification.registrationInfo.credential.publicKey
      ),
      counter: verification.registrationInfo.credential.counter,
      deviceName: (() => {
        const userAgent = request.headers.get('user-agent') || 'Unknown Device';
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        // Extract device info from user agent
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
        const deviceType = isMobile ? 'Mobile' : 'Desktop';

        // Try to extract browser name
        let browserName = 'Browser';
        if (/Chrome/i.test(userAgent) && !/Chromium|Edge/i.test(userAgent)) browserName = 'Chrome';
        else if (/Firefox/i.test(userAgent)) browserName = 'Firefox';
        else if (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edge/i.test(userAgent)) browserName = 'Safari';
        else if (/Edge|Edg/i.test(userAgent)) browserName = 'Edge';

        return `${browserName} on ${deviceType} (${dateStr})`;
      })(),
    },
  });

  return true;
}

// SELF: add email/password to the signed-in user's own passkey account.
// Only for accounts without a password; changing an existing password needs re-authentication
// (not built yet).
export async function addPasswordToPasskeyAccount(email: string, password: string) {
  const user = requireUser();
  const parsed = z
    .object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(200) })
    .safeParse({ email, password });
  if (!parsed.success) return false;
  email = parsed.data.email;

  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });
  if (!current || current.password) return false;

  const emailOwner = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (emailOwner && emailOwner.id !== user.id) return false;

  const hashedPassword = await hashPassword(parsed.data.password);

  await db.user.update({
    where: { id: user.id },
    data: {
      email,
      password: hashedPassword,
    },
  });

  return true;
}

export async function removePasskey(credentialId: string) {
  const user = requireUser();

  try {
    // Delete the credential, ensuring it belongs to the authenticated user
    await db.credential.delete({
      where: {
        credentialId: credentialId,
        userId: user.id,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error removing passkey:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove passkey" };
  }
}

// Add password reset functions
// PUBLIC: forgot password; same response whether or not the email exists
export async function requestPasswordReset(email: string) {
  // Find user
  const user = await db.user.findUnique({
    where: { email },
  });

  // Don't reveal whether the email exists: behave the same either way
  if (!user) return true;

  // Generate token (random string)
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour from now

  // First check if a reset token already exists
  const existingReset = await db.passwordReset.findFirst({
    where: { userId: user.id }
  });

  if (existingReset) {
    // Update existing token
    await db.passwordReset.update({
      where: { id: existingReset.id },
      data: { token, expires }
    });
  } else {
    // Create new token
    await db.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expires
      }
    });
  }

  // Generate reset link
  const { request } = requestInfo;
  const baseUrl = new URL(request.url).origin;
  const resetLink = `${baseUrl}/user/reset-password?token=${token}`;

  // Send email. Resend's test sender (onboarding@resend.dev) only delivers to the
  // account owner, so in development DEV_EMAIL_TO can redirect the message.
  // DEV_EMAIL_TO is optional and only set in .dev.vars, so it is not always in the generated Env type.
  const devEmailTo = (env as Env & { DEV_EMAIL_TO?: string }).DEV_EMAIL_TO;
  const recipient = IS_DEV && devEmailTo ? devEmailTo : email;
  if (IS_DEV) {
    console.log(`[dev] Password reset link for ${email}: ${resetLink}`);
  }

  const emailContent = generatePasswordResetEmail(user.username, resetLink);
  const sent = await sendEmail(recipient, "Password Reset Request", emailContent);
  if (!sent) {
    console.error(`Password reset email to ${recipient} could not be sent`);
  }

  return true;
}

// PUBLIC (TOKEN). Returns only what the reset page shows, never the user row.
export async function verifyResetToken(token: string) {
  const reset = await db.passwordReset.findFirst({
    where: {
      token,
      expires: { gt: new Date() }
    },
    include: { user: { select: { username: true } } }
  });

  return reset ? { username: reset.user.username } : null;
}

// PUBLIC: TOKEN: knowing the reset token is the authorization
export async function resetPassword(token: string, newPassword: string) {
  const reset = await db.passwordReset.findFirst({
    where: {
      token,
      expires: { gt: new Date() }
    }
  });

  if (!reset) return false;

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user password
  await db.user.update({
    where: { id: reset.userId },
    data: { password: hashedPassword }
  });

  // Delete used token
  await db.passwordReset.delete({
    where: { id: reset.id }
  });

  return true;
}
