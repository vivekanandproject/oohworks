import { getPayload } from "payload";
import config from "@payload-config";
import { deliverMail, type Mail } from "@/payload/mailer";

export type { Mail };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Sends an email, or keeps it in the outbox when no email service is configured. */
export async function sendMail(mail: Mail): Promise<"sent" | "outbox"> {
  return deliverMail(await getPayload({ config }), mail);
}
