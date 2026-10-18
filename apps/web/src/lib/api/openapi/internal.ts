import { ENDPOINTS, type Endpoint } from "./internal-endpoints";

/**
 * The internal reference, as OpenAPI 3.1: every endpoint under src/app/api, then the CMS's own REST
 * and GraphQL API. Served at /api/internal/openapi.json and shown at /api/docs/ everywhere except
 * production (src/lib/api/env.ts). The site's endpoints are described in ./internal-endpoints.ts;
 * e2e/api.e2e.ts fails when a route folder has no entry there.
 *
 * Most of the site's endpoints take its own HTML forms: they need this site's Origin header and its
 * cookies, and answer with a redirect to a page, so "Try it out" from this page is refused by design.
 */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const operationId = (e: Endpoint) =>
  e.method +
  e.path
    .split(/[/.-]/)
    .filter((p) => p && p !== "api")
    .map((p) => cap(p.replace(/[{}]/g, "")))
    .join("");

const SCALAR = { string: "string", integer: "integer", number: "number", boolean: "boolean" };

function fieldSchema(f: { type: string; description: string; enum?: string[] }) {
  if (f.type === "file") return { type: "string", format: "binary", description: f.description };
  if (f.type === "array")
    return { type: "array", items: { type: "string" }, description: f.description };
  return {
    type: SCALAR[f.type as keyof typeof SCALAR] ?? "string",
    description: f.description,
    ...(f.enum ? { enum: f.enum } : {}),
  };
}

const MEDIA = {
  form: "application/x-www-form-urlencoded",
  multipart: "multipart/form-data",
  json: "application/json",
} as const;

function operation(e: Endpoint) {
  const lines = [
    e.description ?? "",
    ...(e.checks?.length ? ["", "**Checks, in order**", ...e.checks.map((c) => `- ${c}`)] : []),
    ...(e.setsCookies?.length
      ? ["", "**Sets cookies**", ...e.setsCookies.map((c) => `- ${c}`)]
      : []),
  ];
  const parameters = [
    ...(e.pathParams ?? []).map((p) => ({
      name: p.name,
      in: "path",
      required: true,
      description: p.description,
      schema: { type: "string" },
    })),
    ...(e.query ?? []).map((q) => ({
      name: q.name,
      in: "query",
      required: Boolean(q.required),
      description: q.description,
      schema: fieldSchema(q),
    })),
    ...(e.cookies ?? []).map((c) => ({
      name: c.name,
      in: "cookie",
      required: Boolean(c.required),
      description: c.description,
      schema: { type: "string" },
    })),
  ];
  const responses: Record<string, unknown> = {};
  for (const a of e.answers) {
    const key = String(a.status);
    const existing = responses[key] as { description: string } | undefined;
    const description = a.location ? `${a.when} → \`${a.location}\`` : a.when;
    if (existing) {
      existing.description += `\n\n${description}`;
      continue;
    }
    responses[key] = {
      description,
      ...(a.location
        ? { headers: { Location: { description: a.location, schema: { type: "string" } } } }
        : {}),
      ...(a.json ? { content: { "application/json": { schema: a.json } } } : {}),
      ...(a.file
        ? { content: { [a.file]: { schema: { type: "string", format: "binary" } } } }
        : {}),
    };
  }
  return {
    tags: [e.tag],
    operationId: operationId(e),
    summary: e.summary,
    description: lines.join("\n").trim(),
    ...(parameters.length ? { parameters } : {}),
    ...(e.body && e.fields?.length
      ? {
          requestBody: {
            required: true,
            content: {
              [MEDIA[e.body]]: {
                schema: {
                  type: "object",
                  required: e.fields.filter((f) => f.required).map((f) => f.name),
                  properties: Object.fromEntries(e.fields.map((f) => [f.name, fieldSchema(f)])),
                },
              },
            },
          },
        }
      : {}),
    responses,
  };
}

const paths: Record<string, Record<string, unknown>> = {};
for (const e of ENDPOINTS) (paths[e.path] ??= {})[e.method] = operation(e);

/** The CMS's REST API. Each collection's access rules decide who may read or change what. */
const COLLECTIONS = [
  "sites",
  "owners",
  "enquiries",
  "messages",
  "articles",
  "guides",
  "reports",
  "sources",
  "people",
  "companies",
  "tags",
  "media",
  "issues",
  "follows",
  "subscribers",
  "corrections",
  "outbox",
  "owner-files",
  "access-codes",
  "users",
];
const collection = {
  name: "collection",
  in: "path",
  required: true,
  description: "A CMS collection.",
  schema: { type: "string", enum: COLLECTIONS },
};
const id = {
  name: "id",
  in: "path",
  required: true,
  description: "The document's id.",
  schema: { type: "string" },
};
/** A staff token, the CMS cookie, or nothing for what the public may read. */
const CMS_SIGNED_IN = [{ cmsToken: [] }, { cmsCookie: [] }, {}];
const cmsAuth = "Send `Authorization: JWT <token>` from **Sign in to the CMS**, or the CMS cookie.";
const cmsDoc = { type: "object", additionalProperties: true };
const listOf = {
  type: "object",
  properties: {
    docs: { type: "array", items: cmsDoc },
    totalDocs: { type: "integer" },
    limit: { type: "integer" },
    page: { type: "integer" },
    totalPages: { type: "integer" },
    hasNextPage: { type: "boolean" },
  },
};
const json = (schema: unknown) => ({ content: { "application/json": { schema } } });

Object.assign(paths, {
  "/api/users/login/": {
    post: {
      tags: ["CMS"],
      operationId: "cmsLogin",
      summary: "Sign in to the CMS",
      description: "Staff sign-in. The answer's `token` goes in `Authorization: JWT <token>`.",
      requestBody: {
        required: true,
        ...json({
          type: "object",
          required: ["email", "password"],
          properties: { email: { type: "string" }, password: { type: "string" } },
        }),
      },
      responses: {
        "200": {
          description: "Signed in.",
          ...json({
            type: "object",
            properties: { token: { type: "string" }, user: cmsDoc, exp: { type: "integer" } },
          }),
        },
        "401": { description: "Wrong email or password, or the account is locked." },
      },
    },
  },
  "/api/users/me/": {
    get: {
      tags: ["CMS"],
      operationId: "cmsMe",
      security: CMS_SIGNED_IN,
      summary: "Who is signed in",
      description: cmsAuth,
      responses: { "200": { description: "The signed-in user, or null.", ...json(cmsDoc) } },
    },
  },
  "/api/{collection}/": {
    get: {
      tags: ["CMS"],
      operationId: "cmsList",
      security: CMS_SIGNED_IN,
      summary: "List a collection",
      description: `${cmsAuth} Public collections can be read without it; drafts and private fields never are.`,
      parameters: [
        collection,
        {
          name: "where",
          in: "query",
          style: "deepObject",
          description: "Filters, such as `where[slug][equals]=x`.",
          schema: { type: "object" },
        },
        { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "sort",
          in: "query",
          schema: { type: "string" },
          description: "A field; `-` first for descending.",
        },
        {
          name: "depth",
          in: "query",
          schema: { type: "integer", default: 2 },
          description: "How deep to fill in related documents.",
        },
      ],
      responses: {
        "200": { description: "A page of documents.", ...json(listOf) },
        "403": { description: "Not allowed to read this collection." },
      },
    },
    post: {
      tags: ["CMS"],
      operationId: "cmsCreate",
      security: CMS_SIGNED_IN,
      summary: "Create a document",
      description: `${cmsAuth} Hooks run as they do in the admin: a site's checks, the editorial fact-check gate, and so on.`,
      parameters: [collection],
      requestBody: { required: true, ...json(cmsDoc) },
      responses: {
        "201": { description: "Created.", ...json(cmsDoc) },
        "400": { description: "A field failed its check; the answer says which." },
        "403": { description: "Not allowed." },
      },
    },
  },
  "/api/{collection}/{id}/": {
    get: {
      tags: ["CMS"],
      operationId: "cmsGet",
      security: CMS_SIGNED_IN,
      summary: "Get a document",
      description: cmsAuth,
      parameters: [collection, id],
      responses: {
        "200": { description: "The document.", ...json(cmsDoc) },
        "404": { description: "No such document, or not visible to you." },
      },
    },
    patch: {
      tags: ["CMS"],
      operationId: "cmsUpdate",
      security: CMS_SIGNED_IN,
      summary: "Change a document",
      description: cmsAuth,
      parameters: [collection, id],
      requestBody: { required: true, ...json(cmsDoc) },
      responses: {
        "200": { description: "Changed.", ...json(cmsDoc) },
        "400": { description: "A field failed its check." },
        "403": { description: "Not allowed." },
      },
    },
    delete: {
      tags: ["CMS"],
      operationId: "cmsDelete",
      security: CMS_SIGNED_IN,
      summary: "Delete a document",
      description: `${cmsAuth} Deleting is kept to the most senior role.`,
      parameters: [collection, id],
      responses: {
        "200": { description: "Deleted.", ...json(cmsDoc) },
        "403": { description: "Not allowed." },
      },
    },
  },
  "/api/graphql/": {
    post: {
      tags: ["CMS"],
      operationId: "cmsGraphql",
      security: CMS_SIGNED_IN,
      summary: "Query the CMS with GraphQL",
      description: `The same collections and access rules as the REST API. ${cmsAuth}`,
      requestBody: {
        required: true,
        ...json({
          type: "object",
          required: ["query"],
          properties: { query: { type: "string" }, variables: { type: "object" } },
        }),
      },
      responses: { "200": { description: "The GraphQL answer.", ...json(cmsDoc) } },
    },
  },
});

const TAG_TEXT: Record<string, string> = {
  Service: "Health, these docs and their descriptions.",
  "Public API v1":
    "Listed here so every route has an entry; documented in full in its own specification.",
  Enquiries:
    "A buyer asks about one site or a whole shortlist, and confirms their email with a code.",
  Replies: "Owners answer and buyers write back, from the signed links in their emails.",
  "Shortlist and compare": "Saving and comparing sites, kept in the buyer's own browser.",
  Exports: "The shortlist as a spreadsheet.",
  "Owners: start and sign-in": "Listing a company, confirming its email, and signing in and out.",
  "Owners: company and sites":
    "What a signed-in owner changes: the company, sites, photographs, files and reviews.",
  Places: "The place search on the owners' forms.",
  Reports: "Reports about a listing, from the form on each site page.",
  "Newsletter and follows": "Newsletter sign-ups and follows of a search.",
  CMS: "The CMS's own REST and GraphQL API, used by /admin.",
};
const TAGS = [...new Set(ENDPOINTS.map((e) => e.tag)), "CMS"];

export const internalSpec = {
  openapi: "3.1.0",
  info: {
    title: "OOHWORKS internal reference",
    version: "1.0.0",
    description: [
      "Every endpoint the site serves, for the team. **Not shown in production.**",
      "",
      "- **The site's own endpoints** take its HTML forms. They require this site's `Origin` header and its cookies, and most answer `303 See Other` with a page to go to, so **Try it out** from here is refused by design. Each entry lists its fields, its checks in order, and every answer.",
      "- **The CMS API** (tag CMS) is the CMS's own REST and GraphQL API, used by `/admin`. It needs a staff sign-in for anything that is not public.",
      "- **The public API** is documented in full under *Public API v1* in the selector above.",
      "",
      "### Before any handler",
      "When `ORIGIN_SECRET` is set (staging and production behind Cloudflare), `src/middleware.ts` answers `403 Forbidden` to every request without a matching `X-Origin-Secret` header, except `/api/health/`. It is off on a development machine.",
      "",
      "### The Origin check",
      "Endpoints that change something call `sameOrigin` (src/lib/sites/enquiry.ts): the host in the `Origin` header, or in `Referer` when there is no `Origin`, must equal `X-Forwarded-Host`, else `Host`. A request with neither header is let through; one that cannot be read is refused with `403 Forbidden`. `/api/follow/`, `/api/subscribe/`, `/api/export/shortlist/` and `/api/owner/template/` do not call it; the two `/api/places/` endpoints instead require `Sec-Fetch-Site` to be absent or `same-origin`.",
      "",
      "### Rate limits",
      "Every limit is counted in memory, per server instance and per address, until the shared Redis limiter lands. Each entry gives its numbers.",
    ].join("\n"),
  },
  servers: [{ url: "/", description: "This site" }],
  components: {
    securitySchemes: {
      cmsToken: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "`JWT <token>`, the token from **Sign in to the CMS**.",
      },
      cmsCookie: {
        type: "apiKey",
        in: "cookie",
        name: "payload-token",
        description: "The cookie the CMS sets when staff sign in at /admin.",
      },
    },
  },
  // The site's own endpoints rely on its cookies and Origin check, described above, not on a scheme.
  security: [],
  tags: TAGS.map((name) => ({ name, ...(TAG_TEXT[name] ? { description: TAG_TEXT[name] } : {}) })),
  paths,
};
