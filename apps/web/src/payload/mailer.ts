import type { Payload, PayloadRequest } from "payload";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  kind:
    | "code"
    | "owner_enquiry"
    | "buyer_confirmation"
    | "owner_reply"
    | "buyer_message"
    | "owner_code"
    | "owner_notice"
    | "team_notice";
  /** Replies go here. An owner answers the buyer, never ohworks. */
  replyTo?: string | undefined;
}

/**
 * Sends through the email service when one is configured. Without one, the message is kept in the
 * outbox so the team can read it locally. Nothing is ever silently dropped. It takes the running
 * Payload instance, so hooks can use it without loading the configuration again, and the request
 * when it is called from inside a save.
 */
export async function deliverMail(
  payload: Payload,
  mail: Mail,
  req?: PayloadRequest,
): Promise<"sent" | "outbox"> {
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
  // Inside a save, the note is written on that save's own database connection, so many saves at once
  // never wait on each other for a second one.
  await payload.create({
    collection: "outbox",
    data: { to: mail.to, subject: mail.subject, text: mail.text, kind: mail.kind },
    overrideAccess: true,
    ...(req ? { req } : {}),
  });
  return "outbox";
}
