/**
 * Microsoft Graph API email service.
 * Uses OAuth 2.0 client credentials flow — no user sign-in required.
 *
 * Required Azure AD app permissions (Application, not Delegated):
 *   Mail.Send  — with admin consent granted
 */

interface EmailAddress {
  address: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailAddress | EmailAddress[];
  subject: string;
  /** Plain-text fallback */
  text?: string;
  /** HTML body (preferred) */
  html?: string;
  cc?: EmailAddress | EmailAddress[];
  replyTo?: EmailAddress;
}

interface GraphTokenResponse {
  access_token: string;
  expires_in: number;
}

// Simple in-process token cache — avoids hitting the token endpoint every email
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Azure credentials. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET in .env"
    );
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get Azure access token: ${err}`);
  }

  const data: GraphTokenResponse = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

function toRecipients(input: EmailAddress | EmailAddress[]) {
  return (Array.isArray(input) ? input : [input]).map((r) => ({
    emailAddress: { address: r.address, name: r.name ?? r.address },
  }));
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const from = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME ?? "Volunteer Management System";

  if (!from) {
    throw new Error("EMAIL_FROM is not set in environment variables");
  }

  const token = await getAccessToken();

  const body = options.html
    ? { contentType: "HTML", content: options.html }
    : { contentType: "Text", content: options.text ?? "" };

  const message: Record<string, unknown> = {
    subject: options.subject,
    body,
    from: { emailAddress: { address: from, name: fromName } },
    toRecipients: toRecipients(options.to),
  };

  if (options.cc) message.ccRecipients = toRecipients(options.cc);
  if (options.replyTo) {
    message.replyTo = [{ emailAddress: { address: options.replyTo.address, name: options.replyTo.name } }];
  }

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API sendMail failed (${res.status}): ${err}`);
  }
}

// ---- Reusable email templates ----

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Volunteer Management System";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  await sendEmail({
    to: { address: to, name },
    subject: `Welcome to ${appName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#3b82f6">Welcome, ${name}!</h2>
        <p>Your account has been created for <strong>${appName}</strong>.</p>
        <p>Use the credentials below to sign in:</p>
        <table style="background:#f3f4f6;padding:16px;border-radius:8px;width:100%">
          <tr><td><strong>Email:</strong></td><td>${to}</td></tr>
          <tr><td><strong>Temporary Password:</strong></td><td>TempPass@123!</td></tr>
        </table>
        <p style="margin-top:16px">
          <a href="${appUrl}/login"
             style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
            Sign In Now
          </a>
        </p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">
          Please change your password after your first login.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  await sendEmail({
    to: { address: to, name },
    subject: "Your password has been reset",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#3b82f6">Password Reset</h2>
        <p>Hi ${name},</p>
        <p>An administrator has reset your password.</p>
        <table style="background:#f3f4f6;padding:16px;border-radius:8px;width:100%">
          <tr><td><strong>New Temporary Password:</strong></td><td>TempPass@123!</td></tr>
        </table>
        <p style="margin-top:16px">
          <a href="${appUrl}/login"
             style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
            Sign In and Change Password
          </a>
        </p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">
          If you did not expect this, contact your administrator.
        </p>
      </div>
    `,
  });
}

export async function sendEventAssignmentEmail(
  to: string,
  name: string,
  event: { title: string; date: string; startTime: string; location: string }
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  await sendEmail({
    to: { address: to, name },
    subject: `You've been assigned to: ${event.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#3b82f6">New Event Assignment</h2>
        <p>Hi ${name},</p>
        <p>You have been assigned to volunteer at the following event:</p>
        <table style="background:#f3f4f6;padding:16px;border-radius:8px;width:100%;margin-bottom:16px">
          <tr><td><strong>Event:</strong></td><td>${event.title}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${event.date}</td></tr>
          <tr><td><strong>Time:</strong></td><td>${event.startTime}</td></tr>
          <tr><td><strong>Location:</strong></td><td>${event.location}</td></tr>
        </table>
        <a href="${appUrl}/volunteer-board"
           style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
          View Volunteer Board
        </a>
      </div>
    `,
  });
}
