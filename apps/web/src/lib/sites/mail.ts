import { getPayload } from "payload";
import config from "@payload-config";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  kind: "code" | "owner_enquiry" | "buyer_confirmation" | "owner_reply" | "buyer_message";
  /** Replies go here. An owner answers the buyer, never ohworks. */
  replyTo?: string | undefined;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends through the email service when one is configured. Without one, the message is kept in the
 * outbox so the team can read it locally. Nothing is ever silently dropped.
 */
export async function sendMail(mail: Mail): Promise<"sent" | "outbox"> {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "ohworks <enquiries@ohworks.com>",
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!res.ok) throw new Error(`The email service did not accept the message (${res.status}).`);
    return "sent";
  }
  const payload = await getPayload({ config });
  await payload.create({
    collection: "outbox",
    data: { to: mail.to, subject: mail.subject, text: mail.text, kind: mail.kind },
    overrideAccess: true,
  });
  return "outbox";
}
