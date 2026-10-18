/**
 * Every endpoint under src/app/api, described for the internal reference (./internal.ts). Add an entry
 * with each new route: e2e/api.e2e.ts fails while a route folder has none. Field names are the literal
 * names the handler reads.
 */

export interface Field {
  name: string;
  type: "string" | "integer" | "number" | "boolean" | "file" | "array";
  required?: boolean;
  description: string;
  enum?: string[];
}

export interface Answer {
  status: number;
  when: string;
  /** For a redirect: where it goes, with any query it adds. */
  location?: string;
  /** For JSON: the shape, as a JSON Schema. */
  json?: Record<string, unknown>;
  /** For a file: its content type. */
  file?: string;
}

export interface Endpoint {
  path: string;
  method: "get" | "post";
  tag: string;
  summary: string;
  description?: string;
  body?: "form" | "multipart" | "json";
  fields?: Field[];
  query?: Field[];
  pathParams?: { name: string; description: string }[];
  cookies?: { name: string; required?: boolean; description: string }[];
  checks?: string[];
  setsCookies?: string[];
  answers: Answer[];
}

const PUBLIC = "Public API v1";
const seePublic = "Documented in full under *Public API v1* in the selector above.";

export const ENDPOINTS: Endpoint[] = [
  {
    path: "/api/health/",
    method: "get",
    tag: "Service",
    summary: "Check the service",
    description:
      "Answers while the service is up. The host's health check. Never needs the origin secret.",
    answers: [
      {
        status: 200,
        when: "Up.",
        json: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            service: { type: "string" },
            time: { type: "string" },
          },
        },
      },
    ],
  },
  {
    path: "/api/health/services/",
    method: "get",
    tag: "Service",
    summary: "What this environment is connected to",
    description:
      "Each service's state (ok, off, failing or not used yet), what it answered, how long it took, and its dashboard. Every check is free and read-only: no email is sent and nothing billed is called. Signed-in staff only.",
    cookies: [
      { name: "payload-token", required: true, description: "A staff sign-in to the CMS." },
    ],
    answers: [
      {
        status: 200,
        when: "Signed in as staff.",
        json: {
          type: "object",
          properties: {
            environment: { type: "string" },
            checkedAt: { type: "string" },
            healthy: { type: "boolean", description: "False when any service is failing." },
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  state: { type: "string", enum: ["ok", "off", "failing", "not used yet"] },
                  detail: { type: "string" },
                  ms: { type: ["integer", "null"] },
                  dashboard: { type: ["string", "null"] },
                },
              },
            },
          },
        },
      },
      { status: 401, when: "Not signed in as staff, or the account is suspended." },
    ],
  },
  {
    path: "/api/docs/",
    method: "get",
    tag: "Service",
    summary: "This documentation",
    description:
      "Swagger UI, from the site's own copy of swagger-ui-dist. Offers the internal reference everywhere except production.",
    answers: [{ status: 200, when: "The page.", file: "text/html" }],
  },
  {
    path: "/api/v1/openapi.json",
    method: "get",
    tag: PUBLIC,
    summary: "The public API's description",
    description: "OpenAPI 3.1, as JSON.",
    answers: [{ status: 200, when: "The description.", file: "application/json" }],
  },
  {
    path: "/api/internal/openapi.json",
    method: "get",
    tag: "Service",
    summary: "This reference's description",
    description: "OpenAPI 3.1, as JSON. Answers 404 in production.",
    answers: [
      { status: 200, when: "The description.", file: "application/json" },
      { status: 404, when: "In production." },
    ],
  },
  {
    path: "/api/v1/sites/",
    method: "get",
    tag: PUBLIC,
    summary: "Search sites",
    description: seePublic,
    answers: [{ status: 200, when: "A page of sites." }],
  },
  {
    path: "/api/v1/sites/{unitId}/",
    method: "get",
    tag: PUBLIC,
    summary: "Get one site",
    description: seePublic,
    pathParams: [{ name: "unitId", description: "The site's permanent ID." }],
    answers: [
      { status: 200, when: "The site." },
      { status: 404, when: "No published site has this ID." },
    ],
  },
  {
    path: "/api/v1/owners/{slug}/",
    method: "get",
    tag: PUBLIC,
    summary: "Get an owner",
    description: seePublic,
    pathParams: [{ name: "slug", description: "The owner's slug." }],
    answers: [
      { status: 200, when: "The owner." },
      { status: 404, when: "No owner with published sites has this slug." },
    ],
  },
  {
    path: "/api/v1/cities/",
    method: "get",
    tag: PUBLIC,
    summary: "List cities",
    description: seePublic,
    answers: [{ status: 200, when: "Every city." }],
  },
  {
    path: "/api/v1/formats/",
    method: "get",
    tag: PUBLIC,
    summary: "List formats",
    description: seePublic,
    answers: [{ status: 200, when: "Every format." }],
  },
  {
    path: "/api/report/",
    method: "post",
    tag: "Reports",
    summary: "Report a listing",
    description:
      "The form at the foot of every site page. Stores a listing report for the team, who are emailed and answer within two days, and sends the visitor back to the site page. Works without JavaScript.",
    body: "form",
    fields: [
      { name: "id", type: "string", required: true, description: "The site's unit ID." },
      {
        name: "reason",
        type: "string",
        required: true,
        description: "What is wrong.",
        enum: ["details", "location", "photos", "gone", "permit", "seller", "other"],
      },
      { name: "message", type: "string", description: "What they saw. Cut to 2,000 characters." },
      {
        name: "email",
        type: "string",
        description: "Only to hear back. Never shown on the site.",
      },
      {
        name: "return",
        type: "string",
        description: "The site page to come back to: a path on this site.",
      },
      { name: "website", type: "string", description: "A trap for bots: must be empty." },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "A filled trap field, or more than ten reports a minute from one address: thanked, nothing stored.",
      "The reason must be one of the list; an email, if given, must look right; the unit ID must be a published site.",
    ],
    answers: [
      {
        status: 303,
        when: "Stored, and the team emailed.",
        location: "{return}?reported=1#report",
      },
      {
        status: 303,
        when: "A mistake: the form opens again with a message.",
        location: "{return}?report=reason|email|site#report",
      },
      { status: 403, when: "Posted from another site." },
    ],
  },
  {
    path: "/api/owner/change/withdraw/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Withdraw changes to a live site",
    description:
      "The owner takes back changes to a live site that the team has not yet approved. The live version stays as it is.",
    body: "form",
    fields: [{ name: "id", type: "string", required: true, description: "The site's unit ID." }],
    cookies: [{ name: "oh_owner", required: true, description: "The signed-in owner." }],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "Forty posts a minute from one address.",
      "The site must belong to the signed-in owner.",
    ],
    answers: [
      {
        status: 303,
        when: "Withdrawn, or nothing was waiting.",
        location: "/owner/sites/{id}/?changes=withdrawn#changes",
      },
      { status: 303, when: "Not signed in, or not their site.", location: "/owner/" },
      { status: 403, when: "Posted from another site." },
    ],
  },
  {
    path: "/api/jobs/{job}/",
    method: "post",
    tag: "Service",
    summary: "Run a job on the timer",
    description:
      "The jobs Cloud Scheduler runs (src/lib/jobs): `alerts` hourly (new sites for confirmed follows, each told once), `availability` on Mondays (owners asked to confirm sites not confirmed for three weeks, with a one-tap link), `reply-times` nightly. Skips the origin-secret check; asks for its own secret instead. Without CRON_SECRET set, there are no jobs here.",
    pathParams: [{ name: "job", description: "alerts, availability or reply-times" }],
    checks: ["`Authorization: Bearer <CRON_SECRET>`, compared in constant time."],
    answers: [
      {
        status: 200,
        when: "The job ran.",
        json: {
          type: "object",
          properties: {
            job: { type: "string" },
            ok: { type: "boolean" },
            ms: { type: "integer" },
          },
          additionalProperties: true,
        },
      },
      { status: 401, when: "No secret, or the wrong one." },
      { status: 404, when: "No such job, or CRON_SECRET is not set." },
    ],
  },
  {
    path: "/api/email-link/",
    method: "get",
    tag: "Newsletter and follows",
    summary: "Act on a link in an email",
    description:
      "Confirms a follow (and remembers what it matches today, so only later sites are news) or a newsletter sign-up, ends either, or confirms all of an owner's live, unbooked sites as free today. Each link is signed for one record and one purpose (src/lib/email-links.ts); an availability link works for two weeks.",
    query: [
      {
        name: "p",
        type: "string",
        required: true,
        description: "confirm-follow, unfollow, confirm-subscriber, unsubscribe or availability",
      },
      {
        name: "id",
        type: "string",
        required: true,
        description: "The follow, subscriber or owner.",
      },
      {
        name: "k",
        type: "string",
        required: true,
        description: "The signature: 32 hex characters.",
      },
      { name: "d", type: "string", description: "For availability: the day the link was made." },
    ],
    answers: [
      {
        status: 303,
        when: "Done.",
        location: "/email/following|unfollowed|subscribed|unsubscribed|availability-confirmed/",
      },
      {
        status: 303,
        when: "A link that is not right, or for something that has gone.",
        location: "/email/link-not-valid/",
      },
      {
        status: 303,
        when: "An availability link older than two weeks.",
        location: "/email/link-expired/",
      },
    ],
  },
  // The site's own endpoints, catalogued from each route handler on 18 Oct 2026.
  {
    path: "/api/enquire/",
    method: "post",
    tag: "Enquiries",
    summary: "Send an enquiry about one site",
    description:
      "Takes a buyer's enquiry about one site, stores it, and either delivers it to the owner at once (browser already confirmed this email) or emails the buyer a six-digit code first.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- The reference returned is ENQ-… (one owner).\n- Codes are emailed via Resend when RESEND_API_KEY is set; otherwise written to the Payload 'outbox' collection (no real email).\n- The budget is passed to the owner only on single-site enquiries.",
    body: "form",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description:
          'Permanent unit ID of the site asked about. Trimmed, cut to 12 chars, not lower-cased. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. "ow8k3x2"; lowercase Crockford base-32, no i/l/o/u). Invalid: 303 to /search/.',
      },
      {
        name: "from",
        type: "string",
        required: true,
        description:
          "First day of the campaign. YYYY-MM-DD (trimmed, cut to 10 chars). Must be today or later in India time (Asia/Kolkata). Error code: dates.",
      },
      {
        name: "to",
        type: "string",
        required: true,
        description:
          "Last day of the campaign. YYYY-MM-DD; on or after from; at most 730 days after from. Error code: dates.",
      },
      {
        name: "brand",
        type: "string",
        required: true,
        description:
          "The brand and its category, as the buyer writes it. Trimmed, cut to 120 chars; at least 2 chars. Error code: brand.",
      },
      {
        name: "budget",
        type: "integer",
        description:
          "Monthly budget in rupees for this site. Passed to the owner. Optional. Cut to 20 chars, then spaces, commas and ₹ removed; must be digits only, 1 to 1,000,000,000. Error code: budget.",
      },
      {
        name: "artwork",
        type: "string",
        description:
          'State of the buyer\'s artwork. One of "ready", "in_progress", "not_started"; anything else (or missing) is taken as "not_started". Cut to 20 chars.',
      },
      {
        name: "message",
        type: "string",
        description:
          "Free-text message to the owner(s). Optional. Trimmed and silently cut to 2000 chars.",
      },
      {
        name: "email",
        type: "string",
        required: true,
        description:
          "The buyer's email; owners reply to it. Never echoed back in the redirect. Trimmed, lowercased, at most 254 chars, must match /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/ (cleanEmail). Error code: email.",
      },
      {
        name: "website",
        type: "string",
        description:
          "Honeypot. Hidden from people; must be left empty. Any non-empty value (after trim, first 10 chars) makes the post a silent no-op.",
      },
    ],
    cookies: [
      {
        name: "oh_buyer",
        description:
          "Identifies a buyer: HMAC-signed note of an email this browser confirmed with a code in the last 30 days (set by /api/enquire/confirm/). When it matches the form's email, the enquiry is delivered at once with no code.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "id must be a permanent unit ID, else 303 to /search/.",
      "Honeypot: field website must be empty, else silent 303 to /enquire/{id}/ (nothing stored).",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "enquire", 20 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Shared with /api/enquire/plan/. Refusal: back to the form with error=busy.',
      "The site must exist, be publicly readable, not be removed, and have an owner; else 303 to /search/.",
      "Fields checked in order (fieldError): dates, brand, budget, email; the first failure goes back to the form with that error code.",
      "Per-email flood limit: 5 or more enquiries started from this email in the last hour (lead enquiries, any site) -> error=busy.",
      "Enquiry stored (status pending). If oh_buyer matches the email it is delivered to the owner; otherwise a code is emailed.",
    ],
    answers: [
      {
        status: 303,
        when: "Stored, and the oh_buyer cookie matches the email: the enquiry was emailed to the owner and a confirmation to the buyer.",
        location: "/enquire/sent/?ref={ENQ-reference}",
      },
      {
        status: 303,
        when: "Stored, and a 6-digit code (valid 10 minutes) was emailed to the buyer.",
        location: "/enquire/confirm/?ref={ENQ-reference}",
      },
      {
        status: 303,
        when: "Validation, rate-limit or send failure. error is one of busy (IP rate limit or 5 enquiries from this email in an hour), dates, brand, budget, email, send (email service refused; the enquiry rows are already stored). The form values are echoed except email and message: from/to only if valid dates, brand if non-empty, budget if numeric, artwork always.",
        location:
          "/enquire/{id}/?error={busy|dates|brand|budget|email|send}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&brand={text}&budget={integer}&artwork={ready|in_progress|not_started}",
      },
      {
        status: 303,
        when: "Honeypot field website was filled (silent; nothing stored).",
        location: "/enquire/{id}/",
      },
      {
        status: 303,
        when: "id is not a permanent unit ID, or the site is missing, removed, not public, or has no owner.",
        location: "/search/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/enquire/confirm/",
    method: "post",
    tag: "Enquiries",
    summary: "Confirm a buyer's email with the code",
    description:
      "Checks the emailed six-digit code for an enquiry or plan; a right code delivers it to every owner and remembers the buyer's browser for 30 days.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- The code for a PLN- plan is held on its lead enquiry and covers every owner in the plan.\n- A new code from /api/enquire/resend/ resets the attempt count to 0, which also lifts a lock.",
    body: "form",
    fields: [
      {
        name: "ref",
        type: "string",
        required: true,
        description:
          "Reference of the enquiry (ENQ-…) or of a multi-owner plan (PLN-…). Trimmed. ENQ- followed by 8 characters of 0-9A-HJKMNP-TV-Z (e.g. ENQ-7K2M9QXA), or PLN- followed by 8 characters of 0-9A-HJKMNP-TV-Z. Invalid or unknown: 303 to /search/.",
      },
      {
        name: "code",
        type: "string",
        required: true,
        description:
          "The six-digit code from the email. Every non-digit is removed first; must then be exactly 6 digits. Valid 10 minutes from issue; 5 wrong tries lock it.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "ref must be an ENQ- or PLN- reference, else 303 to /search/.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "enquire-confirm", 20 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: error=busy.',
      "The enquiry group must exist, else 303 to /search/.",
      "If no request in the group is still pending (already delivered), 303 to /enquire/sent/?ref=….",
      "A code must have been issued and not expired (10 minutes), else error=expired.",
      "Code attempts: 5 or more wrong tries already -> error=locked.",
      "Code compared in constant time against the stored HMAC; a wrong code adds an attempt and answers error=wrong, or error=locked when this was the 5th.",
      "Delivery to owners; failure -> error=send.",
    ],
    setsCookies: [
      "`oh_buyer`: Identifies the buyer: HMAC-signed note (scope 'buyer') of the group's email with a 30-day expiry inside it. HttpOnly, SameSite=Lax, Path=/, Secure when NEXT_PUBLIC_SITE_URL is https. Later enquiries from the same email skip the code. (lasts 2592000)",
    ],
    answers: [
      {
        status: 303,
        when: "Right code: the request(s) were emailed to each owner, marked sent, and the buyer got a confirmation. Sets oh_buyer.",
        location: "/enquire/sent/?ref={ref}",
      },
      {
        status: 303,
        when: "The group has nothing pending (already confirmed/delivered). No cookie set.",
        location: "/enquire/sent/?ref={ref}",
      },
      {
        status: 303,
        when: "busy (IP rate limit), expired (no code or past 10 minutes), locked (5 wrong tries), wrong (wrong code), send (an owner's email failed; requests already emailed stay sent and are not re-sent on retry).",
        location: "/enquire/confirm/?ref={ref}&error={busy|expired|locked|wrong|send}",
      },
      {
        status: 303,
        when: "ref is malformed or no such enquiry/plan exists.",
        location: "/search/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/enquire/plan/",
    method: "post",
    tag: "Enquiries",
    summary: "Send one enquiry for a whole shortlist",
    description:
      "Takes one enquiry about a whole shortlist and splits it into one request per owner (each owner sees only their own sites); delivers at once for a confirmed buyer or emails a code first.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- If every site belongs to one owner, no plan is made: the reference is a plain ENQ-… and the request carries no plan reference. With two or more owners the shared reference is PLN-… and each owner's request has its own ENQ-… reference.\n- The buyer's budget is never stored or passed on for a shortlist.\n- A longer shortlist than 25 owners must be sent in parts.",
    body: "form",
    fields: [
      {
        name: "ids",
        type: "array",
        required: true,
        description:
          "Permanent unit IDs of the shortlisted sites. Read with form.getAll('ids'): may be repeated, and each value may itself hold several IDs. All values joined, split on commas, dots and whitespace, lower-cased; only valid IDs kept, each once, at most 50. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. \"ow8k3x2\"; lowercase Crockford base-32, no i/l/o/u). Only publicly listed sites with an owner count. None: error=sites.",
      },
      {
        name: "from",
        type: "string",
        required: true,
        description:
          "First day of the campaign. YYYY-MM-DD (trimmed, cut to 10 chars). Must be today or later in India time (Asia/Kolkata). Error code: dates.",
      },
      {
        name: "to",
        type: "string",
        required: true,
        description:
          "Last day of the campaign. YYYY-MM-DD; on or after from; at most 730 days after from. Error code: dates.",
      },
      {
        name: "brand",
        type: "string",
        required: true,
        description:
          "The brand and its category, as the buyer writes it. Trimmed, cut to 120 chars; at least 2 chars. Error code: brand.",
      },
      {
        name: "budget",
        type: "integer",
        description:
          "Read by readFields but ignored here: a budget for a whole shortlist is never stored, passed to owners, validated or echoed back. Ignored.",
      },
      {
        name: "artwork",
        type: "string",
        description:
          'State of the buyer\'s artwork. One of "ready", "in_progress", "not_started"; anything else (or missing) is taken as "not_started". Cut to 20 chars.',
      },
      {
        name: "message",
        type: "string",
        description:
          "Free-text message to the owner(s). Optional. Trimmed and silently cut to 2000 chars.",
      },
      {
        name: "email",
        type: "string",
        required: true,
        description:
          "The buyer's email; owners reply to it. Never echoed back in the redirect. Trimmed, lowercased, at most 254 chars, must match /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/ (cleanEmail). Error code: email.",
      },
      {
        name: "website",
        type: "string",
        description:
          "Honeypot. Hidden from people; must be left empty. Any non-empty value (after trim, first 10 chars) makes the post a silent no-op.",
      },
    ],
    cookies: [
      {
        name: "oh_buyer",
        description:
          "Identifies a buyer: HMAC-signed note of an email this browser confirmed with a code in the last 30 days (set by /api/enquire/confirm/). When it matches the form's email, the enquiry is delivered at once with no code.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "Honeypot: field website must be empty, else silent 303 to /shortlist/.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "enquire", 20 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Shared with /api/enquire/. Refusal: error=busy.',
      "At least one valid ID -> else error=sites.",
      "Sites are looked up among public listings and grouped by owner; no owner found -> error=sites; more than 25 owners -> error=owners.",
      "Fields checked in order: dates, brand, email (budget is not checked).",
      "Per-email flood limit: 5 or more enquiries started from this email in the last hour -> error=busy.",
      "Requests stored (one per owner). If oh_buyer matches the email they are delivered; otherwise a code is emailed.",
    ],
    answers: [
      {
        status: 303,
        when: "Stored and delivered at once (oh_buyer matches the email).",
        location:
          "/enquire/sent/?ref={PLN-reference, or ENQ-reference when all sites belong to one owner}",
      },
      {
        status: 303,
        when: "Stored and a 6-digit code was emailed.",
        location:
          "/enquire/confirm/?ref={PLN-reference, or ENQ-reference when all sites belong to one owner}",
      },
      {
        status: 303,
        when: "Validation, limit or send failure. error is busy, sites, owners, dates, brand, email or send. Echoes from/to (if valid), brand (if any), artwork, and sites (the parsed IDs, comma-joined, commas left unescaped). Never echoes budget, email or message.",
        location:
          "/enquire/plan/?error={busy|sites|owners|dates|brand|email|send}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&brand={text}&artwork={value}&sites={id1,id2,…}",
      },
      {
        status: 303,
        when: "Honeypot field website was filled (silent; nothing stored).",
        location: "/shortlist/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/enquire/resend/",
    method: "post",
    tag: "Enquiries",
    summary: "Send the buyer's code again",
    description:
      "Emails a fresh six-digit code for a pending enquiry or plan, replacing the old one; at most one every 30 seconds.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Resetting attempts to 0 means a resend also unlocks a code locked by 5 wrong tries.",
    body: "form",
    fields: [
      {
        name: "ref",
        type: "string",
        required: true,
        description:
          "Reference of the enquiry (ENQ-…) or plan (PLN-…). Trimmed. ENQ- followed by 8 characters of 0-9A-HJKMNP-TV-Z (e.g. ENQ-7K2M9QXA), or PLN- followed by 8 characters of 0-9A-HJKMNP-TV-Z. Invalid or unknown: 303 to /search/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "ref must be an ENQ- or PLN- reference, else 303 to /search/.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "enquire-resend", 5 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: error=busy.',
      "Group must exist, else 303 to /search/; nothing pending -> 303 to /enquire/sent/?ref=….",
      "30-second spacing: if the current code was issued (its expiry minus 10 minutes) under 30 seconds ago -> error=wait.",
      "Send failure -> error=send.",
    ],
    answers: [
      {
        status: 303,
        when: "New code emailed (valid 10 minutes; attempts reset to 0).",
        location: "/enquire/confirm/?ref={ref}&resent=1",
      },
      {
        status: 303,
        when: "busy (IP rate limit), wait (last code under 30 s ago), send (email service refused).",
        location: "/enquire/confirm/?ref={ref}&error={busy|wait|send}",
      },
      {
        status: 303,
        when: "Nothing in the group is pending any more.",
        location: "/enquire/sent/?ref={ref}",
      },
      { status: 303, when: "ref malformed or unknown.", location: "/search/" },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/export/shortlist/",
    method: "get",
    tag: "Exports",
    summary: "Download the shortlist as Excel or CSV",
    description:
      "Downloads a shortlist as a standard site sheet, one row per site: an Excel workbook by default or CSV on request, from the IDs in the address or else the buyer's saved shortlist cookie.\n\n- No Origin check: a plain link (GET) works, including the shared-shortlist link with ?sites=.\n- Columns, in order: Unit ID, Site, Format, Static or digital, Size, Width (mm), Height (mm), Lighting, Road, Landmark, Locality, City, Latitude, Longitude, Facing (degrees), Traffic, Price shown as, Rate a month (INR), Minimum period, Printing and mounting, Availability, Booked until, Availability confirmed, [Free on {date} when from is given], Audience a week, Audience source, Audience measured, Permit number, Permit authority, Permit valid to, Owner, Owner verified, Owner's typical reply (hours), Listing, Note. Rate is blank when the price is on request; audience only when figure, source and date are all present.",
    query: [
      {
        name: "sites",
        type: "string",
        description:
          'Permanent unit IDs to export, separated by commas, dots or whitespace; lower-cased; invalid ones dropped; each once; at most 50. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. "ow8k3x2"; lowercase Crockford base-32, no i/l/o/u). When absent or holding no valid ID, the oh_saved cookie is used.',
      },
      {
        name: "from",
        type: "string",
        description:
          "Planned start date, YYYY-MM-DD. When valid, adds a 'Free on {date}' column ('Not booked' / 'No, booked'). Ignored otherwise.",
      },
      {
        name: "format",
        type: "string",
        description: 'Exactly "csv" for CSV; anything else (or absent) gives .xlsx.',
      },
    ],
    cookies: [
      {
        name: "oh_saved",
        description:
          "The buyer's shortlist (permanent IDs joined with dots), read only when the sites query parameter gives no valid ID. Identifies nothing about the buyer.",
      },
    ],
    checks: [
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "export", 20 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 429 text.',
      "At least one of the IDs must be a publicly listed site, else 404 text.",
    ],
    answers: [
      {
        status: 200,
        when: "Default (format is not csv). Sheets: 'Sites' (header row frozen with the first two columns, autofilter, money column formatted #,##,##0; text cells starting =, +, -, @, tab or CR are prefixed with ' so they never run as formulas) and 'About this sheet'. Content-Disposition: attachment; filename=\"ohworks-shortlist-{YYYY-MM-DD}.xlsx\" (India date). Also Cache-Control: no-store and X-Robots-Tag: noindex.",
        file: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      {
        status: 200,
        when: 'format=csv. UTF-8 with a byte-order mark, CRLF line ends, every cell double-quoted, same formula-escaping. Content-Disposition: attachment; filename="ohworks-shortlist-{YYYY-MM-DD}.csv". Also Cache-Control: no-store and X-Robots-Tag: noindex.',
        file: "text/csv",
      },
      {
        status: 404,
        when: "None of the IDs (from the address or the cookie) is a publicly listed site. Body: 'There are no sites to export.'",
      },
      {
        status: 429,
        when: "Rate limit hit. Body: 'Too many downloads in a short time. Try again in a minute.'",
      },
      {
        status: 403,
        when: "Deployment middleware only: ORIGIN_SECRET is set and the X-Origin-Secret header does not match. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error (e.g. database). Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/follow/",
    method: "post",
    tag: "Newsletter and follows",
    summary: "Follow a search for new sites",
    description:
      "Records an email's follow of a city/format search (or a saved search address) from the search page, then returns to that page.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- No confirmation email is sent and no collection hook was found on follows (stored in the Payload 'follows' collection).\n- Without a return field the redirect goes to /search/?followed=1.",
    body: "form",
    fields: [
      {
        name: "return",
        type: "string",
        description:
          "Page to go back to. Must start with / and not with //, else /search/. Anything after # is dropped. Any existing followed or follow query parameter is removed before the result parameter is added. (Unlike safePath, backslashes are not rejected here, but only the path and query are ever put in Location.)",
      },
      {
        name: "company",
        type: "string",
        description:
          "Honeypot. Must be left empty. Any non-empty value: silent success (followed=1), nothing stored.",
      },
      {
        name: "email",
        type: "string",
        required: true,
        description:
          "Email to notify. Trimmed, lowercased, at most 254 chars, must match /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/. Invalid: follow=invalid.",
      },
      {
        name: "city",
        type: "string",
        description: "City followed. Cut to 40 chars; not trimmed or validated.",
      },
      {
        name: "format",
        type: "string",
        description: "Format followed. Cut to 40 chars; not trimmed or validated.",
      },
      {
        name: "q",
        type: "string",
        description: "The search words at the time, stored as query. Cut to 200 chars.",
      },
      {
        name: "search",
        type: "string",
        description:
          "A saved search: the search page's own address. When kept, the follow's source is saved_search, otherwise search. Cut to 400 chars; kept only if it matches /^\\/search\\/(\\?[^#\\s]*)?$/, else ignored.",
      },
    ],
    checks: [
      "No Origin check on this endpoint.",
      "Honeypot field company must be empty, else silent success.",
      "Rate limit: own in-memory limiter in the route (not rateLimited), 30 posts per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For, else 'local'). Over the limit: silent success (followed=1), nothing stored.",
      "email must be valid, else follow=invalid.",
      "De-duplicated: a follow with the same email, city, format and search (or no search) is not stored twice.",
    ],
    answers: [
      {
        status: 303,
        when: "Stored, already followed, honeypot filled, or rate-limited (all look the same).",
        location: "{return path}?{its other query parameters}&followed=1",
      },
      {
        status: 303,
        when: "email is invalid.",
        location: "{return path}?{its other query parameters}&follow=invalid",
      },
      {
        status: 403,
        when: "Deployment middleware only: ORIGIN_SECRET is set and the X-Origin-Secret header does not match. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/lists/",
    method: "post",
    tag: "Shortlist and compare",
    summary: "Save, compare or remove sites",
    description:
      "Changes the buyer's shortlist or compare picks, which live only in the browser's cookies: toggle, remove or add sites, or clear a list; answers JSON to the page's script or redirects a plain form back.\n\n- Works with or without JavaScript: with script, send Accept: application/json and read the JSON; without, a plain form gets a 303.\n- Nothing is stored on the server; the lists exist only in these two cookies (180 days).",
    body: "form",
    fields: [
      {
        name: "list",
        type: "string",
        required: true,
        description:
          'Which list to change. "saved" (the shortlist, max 50) or "compare" (max 4). Anything else is refused like a rate limit (429 JSON or 303 to return).',
      },
      {
        name: "action",
        type: "string",
        description:
          'What to do. "toggle" (default), "remove", "add", "clear". Any other value with a valid id behaves as toggle. toggle adds id if it is a publicly listed site and the list is not full, or removes it if present; remove takes id out; add appends the sites in ids; clear empties the list.',
      },
      {
        name: "id",
        type: "string",
        description:
          'The site for toggle or remove. Needed for those actions; an invalid id changes nothing (no error). Lower-cased. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. "ow8k3x2"; lowercase Crockford base-32, no i/l/o/u).',
      },
      {
        name: "ids",
        type: "string",
        description:
          "Sites for action=add ('Save all' from a compare view or a shared shortlist). Separated by commas, dots or whitespace; valid IDs only, each once, up to the list's max; only publicly listed sites are kept; added in order until the list is full.",
      },
      {
        name: "return",
        type: "string",
        description:
          "Where a plain (no-script) form goes back to. safePath: must start with /, not //, no backslash, else /shortlist/; # part dropped.",
      },
    ],
    cookies: [
      {
        name: "oh_saved",
        description:
          "Current shortlist: permanent IDs joined with dots (read from the raw Cookie header, URI-decoded; invalid IDs dropped, max 50). Identifies nothing about the buyer.",
      },
      {
        name: "oh_compare",
        description: "Current compare picks: permanent IDs joined with dots (max 4).",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Request header Accept containing "application/json" selects a JSON answer; otherwise a redirect.',
      'list must be saved or compare, and Rate limit (rateLimited in src/lib/forms.ts): bucket "lists", 120 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Either failure: 429 JSON {error} or 303 to return; cookies untouched.',
      "toggle only adds a site that exists as a public listing (or is already in the list); add keeps only public listings.",
    ],
    setsCookies: [
      "`oh_saved`: Shortlist IDs joined with dots (empty string when empty). HttpOnly, SameSite=Lax, Path=/, Secure when NEXT_PUBLIC_SITE_URL is https. Set on every applied request, changed or not. (lasts 15552000)",
      "`oh_compare`: Compare IDs joined with dots. Same attributes as oh_saved. (lasts 15552000)",
    ],
    answers: [
      {
        status: 200,
        when: "Accept includes application/json and the change was applied (or was a no-op). Both cookies are re-set.",
        json: {
          type: "object",
          properties: {
            list: { type: "string", description: "string ('saved' | 'compare')" },
            id: {
              type: "string",
              description: "string (the id field as sent, lower-cased; may be empty or invalid)",
            },
            on: {
              type: "boolean",
              description: "boolean (true only when a toggle left the id in the list)",
            },
            full: {
              type: "boolean",
              description: "boolean (true when a toggle could not add because the list was full)",
            },
            saved: { type: "string", description: "string[] (shortlist IDs after the change)" },
            compare: { type: "string", description: "string[] (compare IDs after the change)" },
            text: {
              type: "string",
              description:
                "string (summary of the shortlist, e.g. '3 sites saved · 2 owners · ₹ 1,49,000 a month shown · 1 on request', or 'Nothing saved yet')",
            },
          },
        },
      },
      {
        status: 303,
        when: "No JSON asked for and a toggle on the compare list found it full (4). Cookies re-set.",
        location: "/compare/?full=1",
      },
      {
        status: 303,
        when: "No JSON asked for: after any applied change (cookies re-set), or when list is invalid or the rate limit is hit (cookies untouched).",
        location: "{return path, default /shortlist/}",
      },
      {
        status: 429,
        when: "Accept includes application/json and list is invalid or the rate limit is hit (the same answer for both).",
        json: {
          type: "object",
          properties: {
            error: { type: "string", description: "string ('Try again in a minute.')" },
          },
        },
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/company/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Save the owner's company",
    description:
      "Saves (creates or updates) the signed-in owner's company: name, place, contact, phone, enquiry email, about text and registration number, with an optional verification document.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Does not require an existing owner record: the first save creates the owner (slug from the name, loginEmail = signed-in email, source 'self', verified false).\n- When saved again with the same placeLabel and no new coordinates, the previously matched city is kept.",
    body: "multipart",
    fields: [
      {
        name: "name",
        type: "string",
        required: true,
        description:
          "Company name buyers will see as the seller. Trimmed, cut to 80 chars; 2 to 80 chars. Error code: name.",
      },
      {
        name: "placeLabel",
        type: "string",
        required: true,
        description:
          "Where the company is based, as picked from the place search (or typed). Cut to 160 chars; whitespace collapsed; 2 to 160 chars. Error code: place. Without placeLat/placeLng it is also matched by name to a launch city (aliases such as Bangalore, Bombay, Gurgaon).",
      },
      {
        name: "placeId",
        type: "string",
        description:
          "Google place ID of the picked place. Cut to 300 chars; kept only if it matches /^[A-Za-z0-9_-]{10,300}$/, otherwise stored as null (no error).",
      },
      {
        name: "placeLat",
        type: "number",
        description:
          "Latitude of the picked place, used only to match a launch city within 60 km. Cut to 24 chars; a finite number with |value| <= 90, else ignored (no error).",
      },
      {
        name: "placeLng",
        type: "number",
        description:
          "Longitude of the picked place, used only to match a launch city within 60 km. Cut to 24 chars; a finite number with |value| <= 180, else ignored (no error).",
      },
      {
        name: "placeCountry",
        type: "string",
        description:
          "ISO 3166-1 alpha-2 country of the picked place. Cut to 2 chars; kept (upper-cased) only if two letters, else null (no error). Decides whether gstin is read as an Indian GSTIN.",
      },
      {
        name: "contactName",
        type: "string",
        required: true,
        description:
          "Name of the person to contact. Trimmed, cut to 80 chars; 2 to 80 chars. Error code: contact.",
      },
      {
        name: "phoneCountry",
        type: "string",
        description:
          'ISO country code for the phone number\'s country list. Cut to 2 chars, upper-cased; an unknown code falls back to "IN". A number typed with a leading + carries its own country.',
      },
      {
        name: "phone",
        type: "string",
        required: true,
        description:
          "Contact phone number; stored in international format. Cut to 32 chars; must match /^[+(\\d][\\d\\s().-]*$/ and be a possible number for the country (libphonenumber isPossible, length-based). Error code: phone.",
      },
      {
        name: "gstin",
        type: "string",
        description:
          "In India a GSTIN; elsewhere a company registration or trade licence number. Treated as Indian when placeCountry is IN, or the place matched a launch city, or there is no country and it looks like a GSTIN (2 digits + 13 alphanumerics). Optional; cut to 40 chars. Indian: must be a well-formed GSTIN with a valid check character (spaces and hyphens removed, upper-cased); error code: gstin. Otherwise: /^[A-Za-z0-9][A-Za-z0-9 ./-]{3,39}$/, stored upper-cased; error code: regno.",
      },
      {
        name: "contactEmail",
        type: "string",
        description:
          "Where enquiries go. Blank means the signed-in login email. Trimmed, cut to 254 chars; when not blank must pass cleanEmail. Error code: email.",
      },
      {
        name: "about",
        type: "string",
        description:
          "A short description of the company. Optional; trimmed, cut to 600 chars; empty is stored as null. Not echoed on error.",
      },
      {
        name: "document",
        type: "file",
        description:
          "A document for verification (e.g. GST certificate). Stored privately (only staff can open it) as an owner file of kind 'document' with the note 'For verification'. Optional. At most 10 MB; browser MIME type must be application/pdf, image/jpeg, image/png or image/webp AND the file name must end .pdf, .jpg, .jpeg, .png or .webp. Too big: error=filebig; wrong kind: error=filetype.",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-company", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "Company fields in page order: name, place, contact, phone (gstin/regno held back).",
      "contactEmail (blank = login email) -> error=email.",
      "Then gstin/regno.",
      "Then the document's size and kind (a missing document is fine).",
    ],
    answers: [
      {
        status: 303,
        when: "Saved (and the document stored, if any).",
        location: "/owner/?saved=company",
      },
      {
        status: 303,
        when: "Refused. error is one of name, place, contact, phone, email, gstin, regno, filebig, filetype. Echoes name, placeLabel, placeId, placeLat, placeLng, placeCountry, contactName, phoneCountry, phone, gstin (not about, contactEmail or the file).",
        location:
          "/owner/company/?error={code}&name=…&placeLabel=…&placeId=…&placeLat=…&placeLng=…&placeCountry=…&contactName=…&phoneCountry=…&phone=…&gstin=…",
      },
      {
        status: 303,
        when: "The details were saved but storing the document failed (often a damaged PDF).",
        location: "/owner/company/?error=fileread",
      },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/confirm/",
    method: "post",
    tag: "Owners: start and sign-in",
    summary: "Confirm an owner's email with the code",
    description:
      "Checks an owner's emailed code; a right one signs the browser in as that owner for 30 days and, for a new owner from the start form, creates their company.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- A new code for the same token comes from /api/owner/resend/.",
    body: "form",
    fields: [
      {
        name: "t",
        type: "string",
        required: true,
        description:
          "The attempt token from /api/owner/start/ (carried in the confirm page's address). Trimmed; must be 24 lowercase hex chars and name an unused code, else 303 to /list-your-sites/?error=again.",
      },
      {
        name: "code",
        type: "string",
        required: true,
        description:
          "The six-digit code from the email. Non-digits removed; must be exactly 6 digits. Valid 10 minutes; 5 wrong tries lock it.",
      },
      {
        name: "via",
        type: "string",
        description:
          'Exactly "signin" keeps &via=signin on error redirects (sign-in wording). Does not change what a right code does. "signin" or absent.',
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-confirm", 20 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: error=busy.',
      "Token must name an existing, unused code, else 303 to /list-your-sites/?error=again.",
      "Code not expired (10 minutes) -> else error=expired.",
      "Code attempts: 5 or more wrong tries -> error=locked.",
      "Code compared in constant time against the stored HMAC; wrong adds an attempt -> error=wrong, or error=locked on the 5th. A right code is marked used.",
    ],
    setsCookies: [
      "`oh_owner`: Identifies the owner: HMAC-signed note (scope 'owner') of the confirmed email with a 30-day expiry inside it. HttpOnly, SameSite=Lax, Path=/, Secure when NEXT_PUBLIC_SITE_URL is https. Set on every successful redirect above. (lasts 2592000)",
      '`oh_bar`: Value "owner". NOT HttpOnly, so cached pages can show "Your sites"; proves nothing and opens nothing. SameSite=Lax, Path=/, Secure when https. (lasts 2592000)',
    ],
    answers: [
      {
        status: 303,
        when: "Right code; an owner with this login email already exists and the code came from Sign in (no start details): offered a new password.",
        location: "/owner/password/?after=code",
      },
      {
        status: 303,
        when: "Right code; no owner with this email and no start details (came from Sign in): must give company details next.",
        location: "/owner/company/",
      },
      {
        status: 303,
        when: "Right code with start-form details and no existing owner: the company is created (contact email = login email, password hash from the start form).",
        location: "/owner/?saved=welcome",
      },
      {
        status: 303,
        when: "Right code with start-form details, but an owner with this email already exists: the new details are discarded.",
        location: "/owner/?saved=known",
      },
      {
        status: 303,
        when: "busy (IP rate limit), expired, locked, wrong. The token is URI-encoded.",
        location:
          "/list-your-sites/confirm/?t={token}[&via=signin]&error={busy|expired|locked|wrong}",
      },
      {
        status: 303,
        when: "Token malformed, unknown, or already used.",
        location: "/list-your-sites/?error=again",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/import/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Upload a spreadsheet of sites",
    description:
      "Reads an owner's filled-in spreadsheet template: each valid row becomes a draft site (or updates the draft with the same 'Your reference'); every problem is reported by row and column.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Headers are matched loosely to the template's column names; the column set and rules are SHEET_COLUMNS in src/lib/owners/sheet.ts.\n- Sites are saved as drafts only the owner sees; nothing is published until the owner submits and the team approves.",
    body: "multipart",
    fields: [
      {
        name: "sheet",
        type: "file",
        required: true,
        description:
          "The filled-in template (download it from /api/owner/template/). At most 5 MB; MIME type must be application/vnd.openxmlformats-officedocument.spreadsheetml.sheet AND the name must end .xlsx. Missing/empty: error=missing; too big: error=big; wrong kind: error=type.",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-import", 10 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "An owner record must exist, else 303 to /owner/company/.",
      "File size and kind (fileOf).",
      "Workbook read with exceljs: sheet 'Sites', else the first sheet; header row 1; rows 2 to min(rowCount, 2500) read.",
      "Whole file refused (reported, nothing saved) when: it cannot be opened, a required column is missing (Format, Width, Height, Lighting, City, Area, Road, Price shown as, and Latitude + Longitude unless a 'Map link' column exists), there are no filled rows, or more than 500 filled rows. The example row (Your reference = EXAMPLE) is skipped.",
      "Per row: duplicate 'Your reference' in the file, the same checks as the site form (checkSite), and a row whose reference matches a live site is refused.",
    ],
    answers: [
      {
        status: 303,
        when: "File read (even if refused or every row failed): the file and its report are stored as a private owner file of kind 'sheet'; the import page shows the report. Report shape: { name, created: [{row, id, title}], updated: [{row, id, title}], problems: [{row, column, problem}], unknown: string[] (unrecognised headers), refused: string | null }.",
        location: "/owner/import/?file={owner-file id}",
      },
      {
        status: 303,
        when: "Upload refused before reading: missing, big or type.",
        location: "/owner/import/?error={missing|big|type}",
      },
      {
        status: 303,
        when: "The report/file could not be stored (rows already saved as drafts stay saved).",
        location: "/owner/import/?error=read",
      },
      { status: 303, when: "Signed in but no owner record yet.", location: "/owner/company/" },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/kit/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Send a media kit for the team to enter",
    description:
      "Takes an owner's media kit file for the ohworks team to enter as draft sites, and emails the team.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).",
    body: "multipart",
    fields: [
      {
        name: "kit",
        type: "file",
        required: true,
        description:
          "The media kit. Stored privately as an owner file of kind 'media_kit'. At most 25 MB; MIME type one of application/pdf, image/jpeg, image/png, image/webp, text/csv, .xlsx, application/vnd.ms-excel, .pptx, application/vnd.ms-powerpoint, .docx (OOXML types) AND the name must end .pdf, .jpg, .jpeg, .png, .webp, .csv, .xls, .xlsx, .ppt, .pptx or .docx. Errors: missing, big, type.",
      },
      {
        name: "note",
        type: "string",
        description: "A note for the team. Optional; trimmed, cut to 1000 chars.",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-kit", 10 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "An owner record must exist, else 303 to /owner/company/.",
      "File size and kind (fileOf).",
    ],
    answers: [
      {
        status: 303,
        when: "Stored; a notice is emailed to the team (OPS_EMAIL, default owners@ohworks.com; a failed email is ignored).",
        location: "/owner/kit/?sent=1",
      },
      { status: 303, when: "File refused.", location: "/owner/kit/?error={missing|big|type}" },
      { status: 303, when: "The file could not be stored.", location: "/owner/kit/?error=read" },
      { status: 303, when: "Signed in but no owner record yet.", location: "/owner/company/" },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/password/",
    method: "post",
    tag: "Owners: start and sign-in",
    summary: "Create or change the owner's password",
    description:
      "A signed-in owner sets or changes the password they sign in with; an email tells them it changed.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- The current password is not asked for; being signed in (oh_owner) is enough.",
    body: "form",
    fields: [
      {
        name: "password",
        type: "string",
        required: true,
        description:
          "The new password. Never echoed. 8 to 128 characters; must not equal the owner's login email or its part before @ (case-insensitive). Errors: short, long, same.",
      },
      {
        name: "after",
        type: "string",
        description:
          'Exactly "code" when arriving straight from a code sign-in; kept as &after=code on error redirects. "code" or absent.',
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-password", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "An owner record must exist for the signed-in email, else 303 to /owner/company/.",
      "Password rules (checkNewPassword) -> error=short|long|same.",
    ],
    answers: [
      {
        status: 303,
        when: "Password saved (scrypt hash); failed sign-ins and any lock are cleared; a notice email is sent (a failed notice is ignored).",
        location: "/owner/?saved=password",
      },
      {
        status: 303,
        when: "Password refused.",
        location: "/owner/password/?error={short|long|same}[&after=code]",
      },
      {
        status: 303,
        when: "Signed in but no company/owner record yet.",
        location: "/owner/company/",
      },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/photo/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Add a photograph to a site",
    description:
      "Adds one photograph to one of the owner's sites, with the view it shows and the date it was taken.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- On a live site the photograph is added to the published version at once (no review); on a draft it updates the draft.",
    body: "multipart",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description:
          "Permanent ID of the owner's site. Trimmed, cut to 12 chars. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. \"ow8k3x2\"; lowercase Crockford base-32, no i/l/o/u). Must be one of the signed-in owner's sites (any state), else 303 to /owner/.",
      },
      {
        name: "photo",
        type: "file",
        required: true,
        description:
          "The photograph. Stored as Payload media credited to the owner. At most 10 MB; MIME type image/jpeg, image/png or image/webp AND name ending .jpg, .jpeg, .png or .webp. Errors: perror=missing|big|type.",
      },
      {
        name: "kind",
        type: "string",
        description:
          'Which view the photograph shows. "approach", "day" or "night"; anything else is taken as "approach". Approach views are sorted first.',
      },
      {
        name: "takenOn",
        type: "string",
        required: true,
        description:
          "Date the photograph was taken. YYYY-MM-DD; a real date; not after today (India time); not before 2000-01-01. Error: perror=date.",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-photo", 60 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "Owner record and the site must exist and belong to the owner, else 303 to /owner/.",
      "At most 6 photographs per site -> perror=many.",
      "File size and kind -> perror=missing|big|type.",
      "takenOn -> perror=date.",
    ],
    answers: [
      { status: 303, when: "Photograph added.", location: "/owner/sites/{id}/?photo=added#photos" },
      {
        status: 303,
        when: "many (already 6), missing, big, type, date, read (the image could not be stored).",
        location: "/owner/sites/{id}/?perror={many|missing|big|type|date|read}#photos",
      },
      {
        status: 303,
        when: "No owner record, invalid id, or not this owner's site.",
        location: "/owner/",
      },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/photo/remove/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Remove a photograph",
    description:
      "Takes one photograph off one of the owner's sites and deletes the image.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- On a live site the published version changes at once. The media record deletion is best-effort (errors ignored).",
    body: "form",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description:
          "Permanent ID of the owner's site. Trimmed, cut to 12 chars. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. \"ow8k3x2\"; lowercase Crockford base-32, no i/l/o/u). Must be one of the owner's sites, else 303 to /owner/.",
      },
      {
        name: "media",
        type: "integer",
        description:
          "Database ID of the media (photograph) to remove. Cut to 12 chars; must be a positive integer and one of this site's photographs, otherwise nothing happens (same redirect).",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-photo-remove", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "Owner record and site must exist and belong to the owner, else 303 to /owner/.",
    ],
    answers: [
      {
        status: 303,
        when: "Always after a found site, whether or not a photograph was removed.",
        location: "/owner/sites/{id}/?photo=removed#photos",
      },
      {
        status: 303,
        when: "No owner record, invalid id, or not this owner's site.",
        location: "/owner/",
      },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/quick/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Change a live site's price or availability",
    description:
      "Changes the owner's own facts on a live site at once, with no review: how the price shows, the monthly rate, and availability.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).",
    body: "form",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description:
          "Permanent ID of the owner's live site. Trimmed, cut to 12 chars. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. \"ow8k3x2\"; lowercase Crockford base-32, no i/l/o/u). Must be the owner's site, else 303 to /owner/.",
      },
      {
        name: "priceDisplay",
        type: "string",
        description:
          'How the price shows. "exact", "from" or "on_request" (cut to 12 chars); anything else keeps the site\'s current setting.',
      },
      {
        name: "rate",
        type: "integer",
        description:
          "Monthly rate in rupees. Required unless priceDisplay ends up on_request; stored as null when on_request. Cut to 20 chars; ₹, commas and spaces removed; digits only, 1 to 1,000,000,000. Errors: qerror=rate (bad number), qerror=norate (missing).",
      },
      {
        name: "availability",
        type: "string",
        description:
          '"booked" means booked until bookedUntil; anything else means free now (bookedUntil cleared). "booked" or other.',
      },
      {
        name: "bookedUntil",
        type: "string",
        description:
          'Required when availability=booked. Cut to 20 chars; a date written as YYYY-MM-DD, DD/MM/YYYY (also with . or -), or "3 Oct 2026"; not before today (India time). Error: qerror=date.',
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-quick", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "Owner record and site must exist and belong to the owner, else 303 to /owner/.",
      "Site must be live -> else qerror=notlive.",
      "rate valid -> qerror=rate; rate present unless on_request -> qerror=norate; bookedUntil when booked -> qerror=date.",
    ],
    answers: [
      {
        status: 303,
        when: "Saved on the live site; availability confirmed date set to today.",
        location: "/owner/sites/{id}/?updated=1#update",
      },
      {
        status: 303,
        when: "notlive (site is not live), rate, norate, date.",
        location: "/owner/sites/{id}/?qerror={notlive|rate|norate|date}#update",
      },
      {
        status: 303,
        when: "No owner record, invalid id, or not this owner's site.",
        location: "/owner/",
      },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/resend/",
    method: "post",
    tag: "Owners: start and sign-in",
    summary: "Send the owner's code again",
    description:
      "Emails a fresh code for an owner's sign-up or sign-in attempt, replacing the old one; at most one every 30 seconds.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- The 30-second wait is measured from the access-code row's updatedAt, which a wrong code entry also bumps (attempt counter), so a resend straight after a wrong try also answers error=wait.\n- Resetting attempts to 0 means a resend also unlocks a code locked by 5 wrong tries.",
    body: "form",
    fields: [
      {
        name: "t",
        type: "string",
        required: true,
        description:
          "The attempt token. Trimmed; 24 lowercase hex chars naming an unused code, else 303 to /list-your-sites/?error=again.",
      },
      {
        name: "via",
        type: "string",
        description: 'Exactly "signin" keeps &via=signin on the redirect. "signin" or absent.',
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-resend", 5 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: error=busy.',
      "Token must name an existing, unused code, else 303 to /list-your-sites/?error=again.",
      "30-second spacing, measured from the code row's last update -> error=wait.",
      "Send failure -> error=send.",
    ],
    answers: [
      {
        status: 303,
        when: "New code emailed (valid 10 minutes; attempts reset to 0).",
        location: "/list-your-sites/confirm/?t={token}[&via=signin]&resent=1",
      },
      {
        status: 303,
        when: "busy (IP rate limit), wait (row updated under 30 s ago), send (email service refused).",
        location: "/list-your-sites/confirm/?t={token}[&via=signin]&error={busy|wait|send}",
      },
      {
        status: 303,
        when: "Token malformed, unknown, or already used.",
        location: "/list-your-sites/?error=again",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/signin/",
    method: "post",
    tag: "Owners: start and sign-in",
    summary: "Owner sign-in with user name and password",
    description:
      "Signs an owner in with their work email and password, remembering the browser for 30 days exactly as a code does.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).",
    body: "form",
    fields: [
      {
        name: "email",
        type: "string",
        required: true,
        description:
          "The owner's login (work) email. Echoed back (as typed, trimmed, max 254) after a mistake. Trimmed, cut to 254 chars, then cleanEmail (lowercased, user@domain.tld).",
      },
      {
        name: "password",
        type: "string",
        required: true,
        description:
          "The owner's password. Never echoed. Non-empty, at most 128 characters; otherwise error=match without a lookup.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-signin", 20 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: error=busy.',
      "email valid, password non-empty and at most 128 chars -> else error=match.",
      "Account lock: 5 wrong passwords in a row lock the account for 15 minutes (error=locked; the 5th wrong try itself answers locked). A code by email still signs in.",
      "Unknown email and wrong password both answer error=match, and take as long (a dummy scrypt runs), so the form does not reveal who is listed.",
    ],
    setsCookies: [
      "`oh_owner`: Identifies the owner: HMAC-signed note (scope 'owner') of the email with a 30-day expiry inside it. HttpOnly, SameSite=Lax, Path=/, Secure when https. (lasts 2592000)",
      '`oh_bar`: Value "owner"; not HttpOnly; a display hint only. SameSite=Lax, Path=/, Secure when https. (lasts 2592000)',
    ],
    answers: [
      {
        status: 303,
        when: "Right email and password; failed-try counter and lock cleared. Sets oh_owner and oh_bar.",
        location: "/owner/",
      },
      {
        status: 303,
        when: "busy (IP rate limit), match (unknown email, wrong password, empty or over-long password, invalid email), locked (account locked for 15 minutes).",
        location: "/sign-in/?error={busy|match|locked}&email={typed email}",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/signout/",
    method: "post",
    tag: "Owners: start and sign-in",
    summary: "Owner sign-out",
    description:
      "Signs the owner out of this browser by clearing the owner cookies; their sites are untouched.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Does not check that anyone is signed in. The cleared cookies are set without the Secure attribute.\n- Signing out does not revoke the signed oh_owner value: a copy of it stays valid until its own 30-day expiry (stateless cookie).",
    checks: ["Origin must be this site: see **The Origin check** at the top."],
    setsCookies: [
      "`oh_owner`: Cleared: empty value, HttpOnly, SameSite=Lax, Path=/. (lasts 0)",
      "`oh_bar`: Cleared: empty value, SameSite=Lax, Path=/. (lasts 0)",
    ],
    answers: [
      {
        status: 303,
        when: "Always (after the Origin check). Clears oh_owner and oh_bar.",
        location: "/list-your-sites/?out=1",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
    ],
  },
  {
    path: "/api/owner/site/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Add or change a site",
    description:
      "Saves one site from the owner's form as a draft only they can see (new, or an edit of a site not yet live). For a live site the changes go to the team as a change to a live site (collection site-changes), and buyers see the live version until they are approved; the answer is a 303 to /owner/sites/{id}/?changes=sent (or none, when nothing changed). Mistakes go back to the form with what was typed and each problem named.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Error messages are not in the address: e names the fields, and the form page words them. The same rules apply to spreadsheet rows (/api/owner/import/).\n- Field names are FIELD_KEYS in src/lib/owners/site-input.ts.\n- Saving can throw if the site became live in between; that surfaces as a 500.",
    body: "form",
    fields: [
      {
        name: "id",
        type: "string",
        description:
          'Permanent ID of an existing site to edit. Omit for a new site. Trimmed, cut to 12 chars. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. "ow8k3x2"; lowercase Crockford base-32, no i/l/o/u). When given it must be one of the owner\'s sites, else 303 to /owner/; a live site is not edited here (303 to its page).',
      },
      {
        name: "availability",
        type: "string",
        description:
          '"booked" keeps bookedUntil; anything else (free now) clears it. "booked" or other (cut to 10 chars).',
      },
      {
        name: "ownerRef",
        type: "string",
        description:
          "The owner's own reference code for the site. Optional; whitespace collapsed, cut to 40 chars.",
      },
      {
        name: "format",
        type: "string",
        required: true,
        description:
          'Site format. One of hoarding, unipole, gantry, bus-shelter, led-screen, transit, matched loosely (case and punctuation ignored) against slug, label, plural or in-sentence form ("Bus shelter", "LED screens"); also "billboard(s)" -> hoarding and "led", "digital screen", "dooh" -> led-screen.',
      },
      {
        name: "width",
        type: "number",
        required: true,
        description:
          "Width in the chosen unit. Number (spaces, commas, ₹ stripped; decimals allowed) > 0 and <= 400 ft or <= 120 m.",
      },
      {
        name: "height",
        type: "number",
        required: true,
        description: "Height in the chosen unit. Number > 0 and <= 400 ft or <= 120 m.",
      },
      {
        name: "unit",
        type: "string",
        description:
          'Unit for width and height. "m" or anything starting "met" means metres; anything else (or empty) means feet.',
      },
      {
        name: "lighting",
        type: "string",
        required: true,
        description:
          'Lighting. One of front-lit, back-lit, unlit, digital (labels "Front-lit", "Back-lit", "Not lit", "Digital"; aliases frontlit, lit, backlit, not lit, non lit, none, led).',
      },
      {
        name: "litHours",
        type: "string",
        description: "Hours the site is lit. Optional; cut to 40 chars.",
      },
      {
        name: "city",
        type: "string",
        required: true,
        description:
          "Launch city. One of bengaluru, mumbai, delhi-ncr, hyderabad, pune, chennai (slug, label, or a known alias from CITY_OPTIONS in src/lib/search-parse.ts).",
      },
      {
        name: "locality",
        type: "string",
        required: true,
        description: "Area or neighbourhood. Whitespace collapsed, cut to 60 chars; non-empty.",
      },
      {
        name: "road",
        type: "string",
        required: true,
        description: "Road, as a buyer would name it. Cut to 80 chars; non-empty.",
      },
      {
        name: "landmark",
        type: "string",
        description: "A landmark buyers will know. Optional; cut to 80 chars.",
      },
      {
        name: "lat",
        type: "number",
        required: true,
        description:
          "Latitude of the site. Required unless place yields a position. -90..90, and the point must lie inside India's box (lat 6..37.5, lng 68..97.5), else a 'swapped?' error on lat. Stored to 5 decimals.",
      },
      {
        name: "lng",
        type: "number",
        required: true,
        description:
          "Longitude of the site. Required unless place yields a position. -180..180 (see lat for the India check).",
      },
      {
        name: "place",
        type: "string",
        description:
          "Pasted position: '12.93512, 77.62214' or a Google Maps link. Used only when lat and lng are both empty. Parsed by readCoords (src/lib/owners/coords.ts): !3d..!4d.., ?q=/query=/ll=/destination=/center=, @lat,lng, or two plain numbers. Unreadable: error on place.",
      },
      {
        name: "facing",
        type: "integer",
        description: "Compass bearing the face points to. Optional; 0 to 359 (rounded).",
      },
      {
        name: "traffic",
        type: "string",
        description: "Traffic the site faces. Optional; cut to 40 chars.",
      },
      {
        name: "priceDisplay",
        type: "string",
        description:
          'How the price shows. exact | from | on_request (also "exact rate", "rate", "from price", "on request", "price on request", "request", "hidden"). Empty: "exact" if rate is a number, else "on_request". Any other text is an error.',
      },
      {
        name: "rate",
        type: "integer",
        description:
          "Monthly rate in rupees. Number > 0 and <= 1,000,000,000 (rounded). Required unless priceDisplay is on_request; ignored (null) when on_request.",
      },
      {
        name: "minPeriod",
        type: "string",
        description: "Minimum booking period. Optional; cut to 40 chars.",
      },
      {
        name: "productionCost",
        type: "string",
        description: "Printing and mounting cost. Optional; cut to 80 chars.",
      },
      {
        name: "notAccepted",
        type: "string",
        description: "Categories not accepted. Optional; cut to 120 chars.",
      },
      {
        name: "bookedUntil",
        type: "string",
        description:
          'Date the site is booked until. Cleared unless availability=booked. a date written as YYYY-MM-DD, DD/MM/YYYY (also with . or -), or "3 Oct 2026"; not before today (India time).',
      },
      {
        name: "audienceFigure",
        type: "integer",
        description:
          "Weekly audience. Optional; number > 0. When given, audienceSource and audienceDate become required.",
      },
      {
        name: "audienceMetric",
        type: "string",
        description: "What the audience figure measures. Optional; cut to 80 chars.",
      },
      {
        name: "audienceSource",
        type: "string",
        description:
          "Named source of the audience figure. Cut to 80 chars; required when audienceFigure is given.",
      },
      {
        name: "audienceMethod",
        type: "string",
        description: "How the audience was measured. Optional; cut to 80 chars.",
      },
      {
        name: "audienceDate",
        type: "string",
        description:
          'Date the audience was measured. a date written as YYYY-MM-DD, DD/MM/YYYY (also with . or -), or "3 Oct 2026"; required with audienceFigure; not in the future.',
      },
      {
        name: "permitNumber",
        type: "string",
        description:
          "Permit number. Cut to 60 chars; required if permitAuthority or permitExpires is given.",
      },
      {
        name: "permitAuthority",
        type: "string",
        description: "Who issued the permit. Optional; cut to 80 chars.",
      },
      {
        name: "permitExpires",
        type: "string",
        description:
          'Permit valid-to date. a date written as YYYY-MM-DD, DD/MM/YYYY (also with . or -), or "3 Oct 2026".',
      },
      {
        name: "artworkSpec",
        type: "string",
        description: "Artwork size a buyer should supply. Optional; cut to 80 chars.",
      },
      {
        name: "fileTypes",
        type: "string",
        description: "Accepted artwork file types. Optional; cut to 60 chars.",
      },
      {
        name: "leadTimeDays",
        type: "integer",
        description: "Lead time in days. Optional; 0 to 365.",
      },
      {
        name: "resolution",
        type: "string",
        description:
          "Screen resolution (digital only). Optional; cut to 40 chars; stored only for a digital site (led-screen format or digital lighting).",
      },
      {
        name: "spotSeconds",
        type: "integer",
        description: "Spot length in seconds (digital only). Optional; > 0 and <= 100000.",
      },
      {
        name: "loopSeconds",
        type: "integer",
        description: "Loop length in seconds (digital only). Optional; > 0 and <= 100000.",
      },
      {
        name: "advertisers",
        type: "integer",
        description: "Advertisers in the loop (digital only). Optional; > 0 and <= 100000.",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-site", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "An owner record must exist, else 303 to /owner/company/.",
      "If id is given: must be the owner's site (else /owner/) and not live (else /owner/sites/{id}/).",
      "Each site field is trimmed and cut to 300 chars before checking. If lat and lng are empty and place holds a readable position, it becomes lat/lng.",
      "All fields are checked together (checkSite); every failing field is reported at once.",
    ],
    answers: [
      {
        status: 303,
        when: "Saved as a draft (review state 'draft', or kept 'changes' if the team had asked for changes). A possible duplicate within ~25 m facing the same way is noted for the team.",
        location: "/owner/sites/{permanentId}/?saved=1",
      },
      {
        status: 303,
        when: "Validation failed. Every non-empty site field is echoed under its own name, plus availability (booked|free) and e = comma-separated list of the failing field keys (e.g. e=format,width,lat). The new-site form is used when there is no id.",
        location:
          "/owner/sites/new/?{field}={value}&…&availability={booked|free}&e={key1,key2,…}  or  /owner/sites/{id}/edit/?…",
      },
      { status: 303, when: "id given but invalid or not the owner's site.", location: "/owner/" },
      {
        status: 303,
        when: "id is a live site (changed from its own page instead).",
        location: "/owner/sites/{id}/",
      },
      { status: 303, when: "Signed in but no owner record yet.", location: "/owner/company/" },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/site/remove/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Delete a draft site",
    description:
      "Deletes one of the owner's sites that has never been live (a live site must be withdrawn instead).\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Permanent: the site record is deleted, not drafted.",
    body: "form",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description:
          "Permanent ID of the owner's site. Trimmed, cut to 12 chars. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. \"ow8k3x2\"; lowercase Crockford base-32, no i/l/o/u). Must be one of the owner's sites, else 303 to /owner/.",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-remove", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "Owner record and site must exist and belong to the owner, else 303 to /owner/.",
      "Site must not be live, else 303 to its page (nothing deleted).",
    ],
    answers: [
      { status: 303, when: "Site deleted.", location: "/owner/?removed=1" },
      { status: 303, when: "The site is live; nothing deleted.", location: "/owner/sites/{id}/" },
      {
        status: 303,
        when: "No owner record, invalid id, or not this owner's site.",
        location: "/owner/",
      },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/site/withdraw/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Withdraw a live site",
    description:
      "Takes one of the owner's live sites off ohworks at once; it returns to a draft that can be sent for review again.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).",
    body: "form",
    fields: [
      {
        name: "id",
        type: "string",
        required: true,
        description:
          "Permanent ID of the owner's site. Trimmed, cut to 12 chars. Permanent unit ID: /^ow[0-9a-hjkmnp-tv-z]{5}$/ (e.g. \"ow8k3x2\"; lowercase Crockford base-32, no i/l/o/u). Must be one of the owner's sites, else 303 to /owner/.",
      },
    ],
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-withdraw", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "Owner record and site must exist and belong to the owner, else 303 to /owner/.",
    ],
    answers: [
      {
        status: 303,
        when: "Site found. If it was live it is now unpublished (status draft, review 'draft'); if it was not live nothing changes, but the same redirect is sent.",
        location: "/owner/sites/{id}/?withdrawn=1",
      },
      {
        status: 303,
        when: "No owner record, invalid id, or not this owner's site.",
        location: "/owner/",
      },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/start/",
    method: "post",
    tag: "Owners: start and sign-in",
    summary: "Start listing: the company form",
    description:
      "First step for an owner: from the 'List your sites' start form it checks the company details and a new password, or from Sign in it takes an email alone; either way it emails a six-digit code and creates nothing until the code comes back.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- The token in t names this attempt; the code is checked at /api/owner/confirm/. Codes are stored hashed in the Payload 'access-codes' collection.\n- In via=signin mode only email (and website) are read; the company fields and password are ignored.\n- The password is checked only after the company fields pass, so a field error returns without saying anything about the password.",
    body: "form",
    fields: [
      {
        name: "via",
        type: "string",
        description:
          'Exactly "signin" for the email-only Sign in flow; anything else (or absent) is the start form. "signin" or absent.',
      },
      {
        name: "website",
        type: "string",
        description:
          "Honeypot. Must be left empty. Any non-empty value: silent 303 to the form page (/sign-in/code/ or /list-your-sites/), nothing sent.",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description:
          "Company name buyers will see as the seller. Trimmed, cut to 80 chars; 2 to 80 chars. Error code: name.",
      },
      {
        name: "placeLabel",
        type: "string",
        required: true,
        description:
          "Where the company is based, as picked from the place search (or typed). Cut to 160 chars; whitespace collapsed; 2 to 160 chars. Error code: place. Without placeLat/placeLng it is also matched by name to a launch city (aliases such as Bangalore, Bombay, Gurgaon).",
      },
      {
        name: "placeId",
        type: "string",
        description:
          "Google place ID of the picked place. Cut to 300 chars; kept only if it matches /^[A-Za-z0-9_-]{10,300}$/, otherwise stored as null (no error).",
      },
      {
        name: "placeLat",
        type: "number",
        description:
          "Latitude of the picked place, used only to match a launch city within 60 km. Cut to 24 chars; a finite number with |value| <= 90, else ignored (no error).",
      },
      {
        name: "placeLng",
        type: "number",
        description:
          "Longitude of the picked place, used only to match a launch city within 60 km. Cut to 24 chars; a finite number with |value| <= 180, else ignored (no error).",
      },
      {
        name: "placeCountry",
        type: "string",
        description:
          "ISO 3166-1 alpha-2 country of the picked place. Cut to 2 chars; kept (upper-cased) only if two letters, else null (no error). Decides whether gstin is read as an Indian GSTIN.",
      },
      {
        name: "contactName",
        type: "string",
        required: true,
        description:
          "Name of the person to contact. Trimmed, cut to 80 chars; 2 to 80 chars. Error code: contact.",
      },
      {
        name: "phoneCountry",
        type: "string",
        description:
          'ISO country code for the phone number\'s country list. Cut to 2 chars, upper-cased; an unknown code falls back to "IN". A number typed with a leading + carries its own country.',
      },
      {
        name: "phone",
        type: "string",
        required: true,
        description:
          "Contact phone number; stored in international format. Cut to 32 chars; must match /^[+(\\d][\\d\\s().-]*$/ and be a possible number for the country (libphonenumber isPossible, length-based). Error code: phone.",
      },
      {
        name: "email",
        type: "string",
        required: true,
        description:
          "Work email: becomes the owner's login and the address the code is sent to. Cut to 254 chars; cleanEmail rules (trimmed, lowercased, user@domain.tld). Error code: email.",
      },
      {
        name: "gstin",
        type: "string",
        description:
          "In India a GSTIN; elsewhere a company registration or trade licence number. Treated as Indian when placeCountry is IN, or the place matched a launch city, or there is no country and it looks like a GSTIN (2 digits + 13 alphanumerics). Optional; cut to 40 chars. Indian: must be a well-formed GSTIN with a valid check character (spaces and hyphens removed, upper-cased); error code: gstin. Otherwise: /^[A-Za-z0-9][A-Za-z0-9 ./-]{3,39}$/, stored upper-cased; error code: regno.",
      },
      {
        name: "password",
        type: "string",
        required: true,
        description:
          "Start form only: the password the new owner chooses. Never echoed; only its scrypt hash is kept beside the code. Ignored when via=signin. 8 to 128 characters (not trimmed for length); must not equal the email or its part before @ (case-insensitive, trimmed). Errors: password (too short or too long), passwordsame.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "Honeypot field website must be empty, else silent 303 to the form page.",
      'via=signin: Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-start", 10 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. -> /sign-in/code/?error=busy; email must be valid -> error=email; 5 or more codes for this email in the last hour -> error=busy; send failure -> error=send.',
      "Start form: same rate-limit bucket owner-start, 10/min -> error=busy; then fields in page order (name, place, contact, phone, then email before gstin/regno); then password; then 5 codes per email per hour -> error=busy; send failure -> error=send.",
    ],
    answers: [
      {
        status: 303,
        when: "Start form accepted: code emailed (valid 10 minutes); company details and password hash wait beside it.",
        location: "/list-your-sites/confirm/?t={token: 24 hex chars}",
      },
      {
        status: 303,
        when: "via=signin accepted: code emailed to the address (sent whether or not an owner with that email exists).",
        location: "/list-your-sites/confirm/?t={token: 24 hex chars}&via=signin",
      },
      {
        status: 303,
        when: "Start form refused. error is one of name, place, contact, phone, email, gstin, regno, password, passwordsame, busy, send. Everything typed is echoed back except the password: name, placeLabel, placeId, placeLat, placeLng, placeCountry, contactName, phoneCountry, phone, email, gstin (all present, possibly empty).",
        location:
          "/list-your-sites/?error={code}&name=…&placeLabel=…&placeId=…&placeLat=…&placeLng=…&placeCountry=…&contactName=…&phoneCountry=…&phone=…&email=…&gstin=…",
      },
      {
        status: 303,
        when: "via=signin refused: busy (IP rate limit or 5 codes an hour for this email), email (invalid), send (email service refused).",
        location: "/sign-in/code/?error={busy|email|send}",
      },
      {
        status: 303,
        when: "Honeypot filled (silent).",
        location: "/list-your-sites/  (or /sign-in/code/ when via=signin)",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/submit/",
    method: "post",
    tag: "Owners: company and sites",
    summary: "Send sites for review",
    description:
      "Sends all of the owner's draft and returned ('needs changes') sites to the ohworks team for review, and emails the team and the owner.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Team address is OPS_EMAIL (default owners@ohworks.com).",
    body: "form",
    cookies: [
      {
        name: "oh_owner",
        required: true,
        description:
          "Identifies the owner: HMAC-signed note of the owner's confirmed login email (scope 'owner', 30-day expiry inside the value). Set by /api/owner/confirm/ or /api/owner/signin/. Missing or invalid: 303 to /list-your-sites/.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-submit", 10 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 303 to /owner/?error=busy.',
      "Signed-in owner (ownerGate in src/lib/owners/request.ts): the oh_owner cookie must carry a valid, unexpired owner-scoped signed email; otherwise 303 to /list-your-sites/. Only then is the body read.",
      "An owner record must exist, else 303 to /owner/company/.",
    ],
    answers: [
      {
        status: 303,
        when: "Done. sent is how many sites went for review (0 when none were waiting; then no email is sent).",
        location: "/owner/?sent={count}",
      },
      {
        status: 303,
        when: "An email failed. The sites may already be marked submitted (emails are sent after the updates).",
        location: "/owner/?error=send",
      },
      { status: 303, when: "Signed in but no owner record yet.", location: "/owner/company/" },
      { status: 303, when: "Rate limit hit (ownerGate).", location: "/owner/?error=busy" },
      {
        status: 303,
        when: "No valid oh_owner cookie (not signed in as an owner).",
        location: "/list-your-sites/",
      },
      {
        status: 403,
        when: "Origin/Referer is another site (sameOrigin), or the deployment middleware refuses a request without the right X-Origin-Secret header. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/owner/template/",
    method: "get",
    tag: "Owners: company and sites",
    summary: "Download the spreadsheet template",
    description:
      "Downloads the blank Excel template owners fill in to list many sites at once.\n\n- No sign-in and no Origin check: a plain download link.\n- Built once per server instance and served from memory.\n- Tagged here because it belongs to the owner spreadsheet flow; it is a file download and could equally sit under Exports.",
    checks: [
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "owner-template", 30 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 429 text.',
    ],
    answers: [
      {
        status: 200,
        when: "Always (under the rate limit). Content-Disposition: attachment; filename=\"ohworks-sites-template.xlsx\"; Cache-Control: no-store; X-Robots-Tag: noindex. Sheets: 'Sites' (one column per field, needed columns navy with notes, an italic example row whose 'Your reference' is EXAMPLE, drop-downs for Format, Unit, Lighting, City and Price shown as on rows 2 to 502) and 'How to fill it in'.",
        file: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      {
        status: 429,
        when: "Rate limit hit. Body: 'Too many downloads in a short time. Try again in a minute.'",
      },
      {
        status: 403,
        when: "Deployment middleware only: ORIGIN_SECRET is set and the X-Origin-Secret header does not match. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Building the workbook failed (the cached build is dropped so the next request retries). Next.js default 500.",
      },
    ],
  },
  {
    path: "/api/places/",
    method: "get",
    tag: "Places",
    summary: "Suggest places as the owner types",
    description:
      "Suggests up to six places matching what a visitor has typed, for the place fields on the site's forms; the search service key never leaves the server.\n\n- Called by the page's own scripts (fetch), not by forms.\n- Provider: PLACES_PROVIDER env if set; else Google when GOOGLE_MAPS_API_KEY is set; else Photon in development and the built-in list in production. Any provider failure falls back to the built-in list (provider 'local'). Photon answers are cached in memory for 5 minutes.",
    query: [
      {
        name: "q",
        type: "string",
        description:
          "What has been typed. Trimmed, whitespace collapsed, cut to 80 chars; fewer than 2 chars returns no suggestions.",
      },
      {
        name: "scope",
        type: "string",
        description:
          '"any" searches any address or landmark (for a site); anything else (default) searches cities (for a company\'s base).',
      },
      {
        name: "s",
        type: "string",
        description:
          "Session token for one run of typing (so Google bills it as one search): 36 chars of 0-9, a-f and '-' (a UUID); anything else is ignored.",
      },
    ],
    checks: [
      "Own page only (ownPage in src/lib/places/request.ts): the Sec-Fetch-Site request header must be absent or exactly 'same-origin'; otherwise 403 JSON.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "places", 90 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 429 JSON.',
    ],
    answers: [
      {
        status: 200,
        when: "Always otherwise (also when q is too short: empty list). Headers: content-type application/json; charset=utf-8, cache-control no-store.",
        json: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              description: "string ('google' | 'photon' | 'local': which service answered)",
            },
            suggestions: {
              type: "array",
              description:
                "array (max 6) of { id: string (opaque; pass to /api/places/detail/. Prefix 'g:' Google place, 'p:' Photon with the place carried in base64url JSON, 'l:' built-in city list), label: string, detail: string (region and country) }",
            },
          },
        },
      },
      {
        status: 403,
        when: "Sec-Fetch-Site is present and not same-origin.",
        json: {
          type: "object",
          properties: { suggestions: { type: "array", description: "array (always empty)" } },
        },
      },
      {
        status: 429,
        when: "Rate limit hit.",
        json: {
          type: "object",
          properties: { suggestions: { type: "array", description: "array (always empty)" } },
        },
      },
      {
        status: 403,
        when: "Deployment middleware only: ORIGIN_SECRET is set and the X-Origin-Secret header does not match. Body is the plain text 'Forbidden'.",
      },
    ],
  },
  {
    path: "/api/places/detail/",
    method: "get",
    tag: "Places",
    summary: "Look up one suggested place",
    description:
      "Returns what is known about a place the visitor picked from the suggestions (full label, country, coordinates) and which launch city it falls in, if any.\n\n- Called by the page's own scripts (fetch). The 403/429 bodies carry place only, no city key.",
    query: [
      {
        name: "id",
        type: "string",
        required: true,
        description:
          "A suggestion id from /api/places/ (cut to 2000 chars). Unknown prefix, bad id, or a 'g:' id without GOOGLE_MAPS_API_KEY gives place null (still 200).",
      },
      {
        name: "s",
        type: "string",
        description:
          "The same session token as the search (UUID-shaped, 36 chars of 0-9a-f-); else ignored.",
      },
    ],
    checks: [
      "Own page only (ownPage in src/lib/places/request.ts): the Sec-Fetch-Site request header must be absent or exactly 'same-origin'; otherwise 403 JSON.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "places-detail", 40 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: 429 JSON.',
    ],
    answers: [
      {
        status: 200,
        when: "Always otherwise. Headers: content-type application/json; charset=utf-8, cache-control no-store.",
        json: {
          type: "object",
          properties: {
            place: {
              type: "object",
              description:
                "object | null: { id: string, label: string, locality: string | null, region: string | null, country: string | null, countryCode: string | null (ISO alpha-2, upper case), lat: number | null, lng: number | null }",
            },
            city: {
              type: "string",
              description:
                "string | null: launch city slug (bengaluru | mumbai | delhi-ncr | hyderabad | pune | chennai) when the place is within 60 km of its centre (or, with no coordinates, matches by name); null when place is null",
            },
          },
        },
      },
      {
        status: 403,
        when: "Sec-Fetch-Site is present and not same-origin.",
        json: { type: "object", properties: { place: { description: "null" } } },
      },
      {
        status: 429,
        when: "Rate limit hit.",
        json: { type: "object", properties: { place: { description: "null" } } },
      },
      {
        status: 403,
        when: "Deployment middleware only: ORIGIN_SECRET is set and the X-Origin-Secret header does not match. Body is the plain text 'Forbidden'.",
      },
    ],
  },
  {
    path: "/api/reply/",
    method: "post",
    tag: "Replies",
    summary: "Owner answers an enquiry",
    description:
      "An owner answers an enquiry from the link in their enquiry email (availability and a monthly quote per site, and/or a message); the answer is kept on the thread and emailed straight to the buyer.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- No sign-in: the owner's key travels in the emailed link's k query parameter and is posted back as the k field. Treat links as secrets.\n- Answers for sites not in this request are ignored.",
    body: "form",
    fields: [
      {
        name: "ref",
        type: "string",
        required: true,
        description:
          "The owner's own request reference (ENQ-…, also for a request that is part of a plan). Trimmed. ENQ- followed by 8 characters of 0-9A-HJKMNP-TV-Z (e.g. ENQ-7K2M9QXA). PLN- references are refused (403).",
      },
      {
        name: "k",
        type: "string",
        required: true,
        description:
          "The owner's key from the emailed link (/reply/{ref}/?k=…). It is what proves this is the owner. 32 lowercase hex chars; HMAC of the reference for the owner role; compared in constant time. A buyer's key does not work.",
      },
      {
        name: "body",
        type: "string",
        description:
          "Message to the buyer. Trimmed, silently cut to 4000 chars. Either body or at least one a-/q- answer is required (error=empty).",
      },
      {
        name: "a-{siteId}",
        type: "string",
        description:
          'Availability for one site of the request; {siteId} is the site\'s numeric database ID (not its permanent ID). One per site. "available", "unavailable" or "other_dates"; anything else is ignored.',
      },
      {
        name: "q-{siteId}",
        type: "integer",
        description:
          "Monthly quote in rupees for one site; {siteId} as above. Spaces, commas and ₹ removed; digits only, 1 to 1,000,000,000; otherwise error=quote. Empty is fine.",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "ref must be an ENQ- reference and k its owner key, else 403 text 'Forbidden'.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "reply", 30 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: error=busy.',
      "The request must exist and be delivered (not pending), else 404 text 'Not found'.",
      "Each q-{siteId} must be a valid amount -> else error=quote (checked per site in order).",
      "Something must be said: body or an answer -> else error=empty.",
      "Stored and emailed; failure -> error=send.",
    ],
    answers: [
      {
        status: 303,
        when: "Reply stored on the thread, request marked replied (the first reply also sets the reply time used for the owner's median-reply badge), and emailed to the buyer.",
        location: "/reply/{ref}/?k={k}&sent=1",
      },
      {
        status: 303,
        when: "busy (IP rate limit), quote (bad amount), empty (nothing given), send (the email failed; the reply may already be stored).",
        location: "/reply/{ref}/?k={k}&error={busy|quote|empty|send}",
      },
      {
        status: 403,
        when: "Foreign Origin; or ref malformed / not ENQ-; or k missing or wrong; or the deployment middleware refuses. Body 'Forbidden'.",
      },
      {
        status: 404,
        when: "No such request, or it is still pending (buyer has not confirmed). Body 'Not found'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/subscribe/",
    method: "post",
    tag: "Newsletter and follows",
    summary: "Sign up for the newsletter",
    description:
      "Adds an email to the daily newsroom briefing list and sends the browser to the thank-you page.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- Stored in the Payload 'subscribers' collection with lists ['daily']. No confirmation (double opt-in) email is sent by this route, and no collection hook was found.",
    body: "form",
    fields: [
      {
        name: "company",
        type: "string",
        description:
          "Honeypot. Must be left empty. Any non-empty value: silent success, nothing stored.",
      },
      {
        name: "email",
        type: "string",
        required: true,
        description:
          "Subscriber's email. cleanEmail: trimmed, lowercased, at most 254 chars, /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/. Invalid: error=email.",
      },
      {
        name: "from",
        type: "string",
        description:
          "The page the form was on, stored as the subscriber's source. safePath: must start with / and not // and contain no backslash, else /newsroom/; # part dropped; cut to 200 chars.",
      },
    ],
    checks: [
      "No Origin check on this endpoint.",
      "Honeypot field company must be empty, else silent success.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "subscribe", 30 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Over the limit: silent success, nothing stored.',
      "email must be valid, else error=email.",
      "De-duplicated by email: an existing subscriber is left unchanged.",
    ],
    answers: [
      {
        status: 303,
        when: "Subscribed, already subscribed, honeypot filled, or rate-limited (all look the same).",
        location: "/newsroom/subscribed/",
      },
      { status: 303, when: "email is invalid.", location: "/newsroom/subscribed/?error=email" },
      {
        status: 403,
        when: "Deployment middleware only: ORIGIN_SECRET is set and the X-Origin-Secret header does not match. Body is the plain text 'Forbidden'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
  {
    path: "/api/thread/",
    method: "post",
    tag: "Replies",
    summary: "Buyer writes back to one owner",
    description:
      "A buyer writes a follow-up to one owner of their enquiry or plan, from the link in their confirmation email; it is kept on the thread and emailed straight to that owner.\n\n- Works without JavaScript: a plain HTML form post answered with a 303 whose Location is a site-relative path (never a full URL).\n- No sign-in: the buyer's key travels in the emailed link's k query parameter and is posted back as the k field. One key opens the whole group (every owner's thread), never another enquiry.",
    body: "form",
    fields: [
      {
        name: "ref",
        type: "string",
        required: true,
        description:
          "The buyer's group reference: ENQ-… for one enquiry or PLN-… for a plan. Trimmed. ENQ- followed by 8 characters of 0-9A-HJKMNP-TV-Z (e.g. ENQ-7K2M9QXA), or PLN- followed by 8 characters of 0-9A-HJKMNP-TV-Z.",
      },
      {
        name: "k",
        type: "string",
        required: true,
        description:
          "The buyer's key from the emailed link (/enquiries/{ref}/?k=…). It is what proves this is the buyer. 32 lowercase hex chars; HMAC of the reference for the buyer role; compared in constant time. An owner's key does not work.",
      },
      {
        name: "to",
        type: "string",
        required: true,
        description:
          "The ENQ- reference of the one request (owner) in the group to write to; for a single enquiry it equals ref. Trimmed; must equal the reference of a request in the group, else 404. Not otherwise validated, and echoed as the URL fragment (#…) of the redirect.",
      },
      {
        name: "body",
        type: "string",
        required: true,
        description:
          "The message. Trimmed, silently cut to 4000 chars; at least 2 chars (error=empty).",
      },
    ],
    checks: [
      "Origin must be this site: see **The Origin check** at the top.",
      "ref must be an ENQ- or PLN- reference and k its buyer key, else 403 text 'Forbidden'.",
      'Rate limit (rateLimited in src/lib/forms.ts): bucket "thread", 30 requests per sliding 60 seconds per client IP (CF-Connecting-IP, else first X-Forwarded-For entry, else "local"); in memory, per server instance; refused requests also count. Refusal: error=busy.',
      "The group must exist and contain a delivered (not pending) request whose reference equals to, else 404 text 'Not found'.",
      "body at least 2 chars -> else error=empty.",
      "Per request: 10 or more buyer messages to this owner in the last hour -> error=busy.",
      "Stored and emailed; failure -> error=send.",
    ],
    answers: [
      {
        status: 303,
        when: "Message stored and emailed to the owner.",
        location: "/enquiries/{ref}/?k={k}&sent=1#{to}",
      },
      {
        status: 303,
        when: "busy (IP rate limit or 10 messages an hour to this owner), empty, send (email failed; the message is already stored).",
        location: "/enquiries/{ref}/?k={k}&error={busy|empty|send}#{to}",
      },
      {
        status: 403,
        when: "Foreign Origin; or ref malformed; or k missing or wrong; or the deployment middleware refuses. Body 'Forbidden'.",
      },
      {
        status: 404,
        when: "No such group, to is not one of its requests, or that request is still pending. Body 'Not found'.",
      },
      {
        status: 500,
        when: "Unhandled error: the body cannot be parsed as form data (req.formData() throws, e.g. a JSON body), or a database error. Next.js's default error response; the handler sets no body. (Exact body is Next.js's, not verified.)",
      },
    ],
  },
];
