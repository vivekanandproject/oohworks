import { rateLimited } from "@/lib/forms";
import { sameOrigin } from "@/lib/sites/enquiry";
import type { Owner } from "@/payload-types";
import { ownerByEmail, ownerEmail } from "./server";

export const text = (form: FormData, name: string, max: number): string =>
  String(form.get(name) ?? "")
    .trim()
    .slice(0, max);

export const go = (path: string): Response =>
  new Response(null, { status: 303, headers: { Location: path } });

export type Gate =
  | { ok: true; form: FormData; email: string; owner: Owner | null }
  | { ok: false; response: Response };

/**
 * What every owner endpoint checks first: the post came from this site, it is not a flood, and this
 * browser has confirmed an owner's email. Anything else is turned away before the form is read further.
 */
export async function ownerGate(req: Request, bucket: string, limit = 40): Promise<Gate> {
  if (!sameOrigin(req)) return { ok: false, response: new Response("Forbidden", { status: 403 }) };
  if (rateLimited(req, `owner-${bucket}`, limit))
    return { ok: false, response: go("/owner/?error=busy") };
  const email = await ownerEmail();
  if (!email) return { ok: false, response: go("/list-your-sites/") };
  return { ok: true, form: await req.formData(), email, owner: await ownerByEmail(email) };
}

const MB = 1024 * 1024;
export const FILE_RULES = {
  photo: {
    max: 10 * MB,
    types: ["image/jpeg", "image/png", "image/webp"],
    ext: /\.(jpe?g|png|webp)$/i,
  },
  document: {
    max: 10 * MB,
    types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    ext: /\.(pdf|jpe?g|png|webp)$/i,
  },
  sheet: {
    max: 5 * MB,
    types: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ext: /\.xlsx$/i,
  },
  kit: {
    max: 25 * MB,
    types: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    ext: /\.(pdf|jpe?g|png|webp|csv|xlsx?|pptx?|docx)$/i,
  },
} as const;

export type FileProblem = "missing" | "big" | "type";

/** A file from a form, checked for size and kind before anything is stored. */
export function fileOf(
  form: FormData,
  name: string,
  rule: keyof typeof FILE_RULES,
): { file: File } | { problem: FileProblem } {
  const value = form.get(name);
  if (!(value instanceof File) || value.size === 0) return { problem: "missing" };
  const r = FILE_RULES[rule];
  if (value.size > r.max) return { problem: "big" };
  // The browser's word for the type and the file's own name must both agree with what is allowed.
  if (!(r.types as readonly string[]).includes(value.type) || !r.ext.test(value.name))
    return { problem: "type" };
  return { file: value };
}
