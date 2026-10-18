import { MAX_PER_PAGE } from "@/lib/api/sites";
import { PER_PAGE } from "@/lib/sites/queries";
import { CITIES, ENVIRONMENTS, FORMATS, LIGHTING, SORTS, TRUST } from "@/lib/sites/taxonomy";

/**
 * The public API, version 1, as OpenAPI 3.1. Served at /api/v1/openapi.json and shown at /api/docs/.
 * Lists of cities, formats, lighting, checks and orders come from the site's own taxonomy, so the
 * documentation cannot name a value the API does not accept. e2e/api.e2e.ts checks every answer
 * against the schemas below.
 */

const slugs = <T extends { slug: string }>(list: readonly T[]) => list.map((x) => x.slug);
const commaList = (values: string[], what: string) => ({
  type: "string",
  description: `One or more ${what}, separated by commas. Allowed: ${values.join(", ")}.`,
});

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });
const date = { type: "string", format: "date", description: "A calendar date in India." };
const named = (values: string[]) => ({
  type: "object",
  required: ["slug", "label"],
  properties: { slug: { type: "string", enum: values }, label: { type: "string" } },
});

const SiteSummary = {
  type: "object",
  description:
    "A site as it appears in search results. The owner is always the seller; ohworks never is.",
  required: [
    "unitId",
    "title",
    "url",
    "enquireUrl",
    "format",
    "type",
    "size",
    "lighting",
    "location",
    "price",
    "availability",
    "checks",
    "owner",
    "sample",
    "updatedAt",
  ],
  properties: {
    unitId: {
      type: "string",
      description: "The site's permanent ID. It never changes.",
      examples: ["ows0001"],
    },
    title: { type: "string", examples: ["20 × 10 ft hoarding, 80 Feet Road"] },
    url: { type: "string", format: "uri", description: "The site's page on ohworks." },
    enquireUrl: {
      type: "string",
      format: "uri",
      description:
        "Where a buyer asks the owner about this site. Enquiries go straight to the owner.",
    },
    format: named(slugs(FORMATS)),
    type: { type: "string", enum: ["static", "digital"] },
    size: {
      type: "object",
      required: ["label", "width", "height", "unit", "widthMm", "heightMm"],
      properties: {
        label: { type: "string", examples: ["20 × 10 ft"] },
        width: { type: "number", description: "As the owner gave it, in `unit`." },
        height: { type: "number" },
        unit: { type: "string", enum: ["ft", "m"] },
        widthMm: nullable({ type: "integer" }),
        heightMm: nullable({ type: "integer" }),
      },
    },
    lighting: named(slugs(LIGHTING)),
    location: {
      type: "object",
      required: ["road", "landmark", "locality", "city", "country", "lat", "lng"],
      properties: {
        road: { type: "string" },
        landmark: nullable({ type: "string" }),
        locality: { type: "string" },
        city: named(slugs(CITIES)),
        country: { type: "string", examples: ["IN"] },
        lat: { type: "number", description: "Latitude to five decimals (about a metre)." },
        lng: { type: "number" },
        facingDeg: nullable({
          type: "number",
          description: "The way the face points, as a compass bearing.",
        }),
        facing: nullable({ type: "string", examples: ["225° SW"] }),
      },
    },
    price: {
      type: "object",
      required: ["display", "monthlyInr", "label"],
      properties: {
        display: {
          type: "string",
          enum: ["exact", "from", "on_request"],
          description:
            "How the owner chose to show the price. `from` is a floor, not the rate. The owner may keep it private.",
        },
        monthlyInr: nullable({
          type: "integer",
          description: "Rupees a month, or null when the owner shows no price.",
        }),
        label: { type: "string", examples: ["₹ 85,000 a month", "Price on request"] },
      },
    },
    availability: {
      type: "object",
      required: ["state", "label", "bookedUntil", "confirmedOn"],
      properties: {
        state: {
          type: "string",
          enum: ["free", "booked", "stale"],
          description:
            "`stale` means the owner has not confirmed availability in the last 30 days, or ever.",
        },
        label: { type: "string", examples: ["Available now", "Booked until 14 Nov 2026"] },
        bookedUntil: nullable(date),
        confirmedOn: nullable(date),
      },
    },
    checks: {
      type: "array",
      items: { type: "string" },
      description:
        "What ohworks has checked, in words, such as Verified owner, Verified location, Permit on file. Only checks the site has passed.",
    },
    owner: {
      type: "object",
      required: ["name", "slug", "verified", "medianReplyHours"],
      description: "The seller. Contact details are never in the API; buyers use `enquireUrl`.",
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
        verified: { type: "boolean" },
        medianReplyHours: nullable({
          type: "number",
          description: "Typical time to answer an enquiry, once the owner has answered five.",
        }),
      },
    },
    sample: {
      type: "boolean",
      description:
        "A labelled sample for testing. Samples exist only in test and preview databases, never in production.",
    },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const SiteDetail = {
  description: "Everything a site's page shows, before anyone has to ask.",
  allOf: [
    { $ref: "#/components/schemas/SiteSummary" },
    {
      type: "object",
      required: [
        "description",
        "environment",
        "litHours",
        "digital",
        "terms",
        "creative",
        "audience",
        "permit",
        "photos",
        "ownerSiteCount",
      ],
      properties: {
        description: { type: "string", description: "A factual summary built from the fields." },
        environment: { type: "string", enum: slugs(ENVIRONMENTS) },
        litHours: nullable({ type: "string" }),
        digital: nullable({
          type: "object",
          description: "Only for digital screens.",
          properties: {
            resolution: nullable({ type: "string" }),
            spotSeconds: nullable({ type: "number" }),
            loopSeconds: nullable({ type: "number" }),
            advertisers: nullable({ type: "number" }),
            exchanges: nullable({
              type: "string",
              description: "Where the screen can also be bought programmatically.",
            }),
          },
        }),
        terms: {
          type: "object",
          properties: {
            minPeriod: nullable({ type: "string" }),
            productionCost: nullable({
              type: "string",
              description: "Printing and mounting, in the owner's words.",
            }),
            taxesNote: nullable({ type: "string" }),
            notAccepted: nullable({
              type: "string",
              description: "Categories of advertising the owner does not accept.",
            }),
          },
        },
        creative: {
          type: "object",
          properties: {
            artworkSpec: nullable({ type: "string" }),
            fileTypes: nullable({ type: "string" }),
            leadTimeDays: nullable({ type: "number" }),
          },
        },
        audience: nullable({
          type: "object",
          description: "Shown only with its source and the date it was measured.",
          required: ["figure", "source", "measuredOn"],
          properties: {
            figure: { type: "number" },
            metric: nullable({ type: "string" }),
            source: { type: "string" },
            method: nullable({ type: "string" }),
            measuredOn: date,
          },
        }),
        permit: nullable({
          type: "object",
          required: ["state"],
          properties: {
            state: { type: "string", enum: ["valid", "expired"] },
            number: nullable({ type: "string" }),
            authority: nullable({ type: "string" }),
            validTo: nullable(date),
          },
        }),
        photos: {
          type: "array",
          description:
            "Real photographs of the face in its street, each with the date it was taken.",
          items: {
            type: "object",
            required: ["url", "view", "takenOn"],
            properties: {
              url: { type: "string", format: "uri" },
              view: { type: "string", enum: ["approach", "day", "night"] },
              takenOn: nullable(date),
              gpsStamped: { type: "boolean" },
              alt: { type: "string" },
              credit: { type: "string" },
              width: nullable({ type: "integer" }),
              height: nullable({ type: "integer" }),
            },
          },
        },
        ownerSiteCount: {
          type: "integer",
          description: "How many published sites this owner has.",
        },
      },
    },
  ],
};

const Filters = {
  type: "object",
  description:
    "The filters the search applied, after reading the parameters and any typed text in `q`. A value that is not allowed is left out, not refused.",
  properties: {
    q: nullable({ type: "string" }),
    city: nullable({ type: "string" }),
    localities: { type: "array", items: { type: "string" } },
    formats: { type: "array", items: { type: "string" } },
    type: nullable({ type: "string", enum: ["static", "digital"] }),
    size: nullable({ type: "string", examples: ["20x10"] }),
    lighting: { type: "array", items: { type: "string" } },
    min: nullable({ type: "integer" }),
    max: nullable({ type: "integer" }),
    priced: { type: "boolean" },
    from: nullable(date),
    to: nullable(date),
    trust: { type: "array", items: { type: "string" } },
    bbox: nullable({ type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 }),
    owner: nullable({ type: "string" }),
    sort: { type: "string", enum: SORTS.map((s) => s.key) },
  },
};

const problemResponse = (description: string) => ({
  description,
  content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } },
});

const query = (name: string, schema: Record<string, unknown>, description?: string) => ({
  name,
  in: "query",
  required: false,
  ...(description ? { description } : {}),
  schema,
});

export const publicSpec = {
  openapi: "3.1.0",
  info: {
    title: "ohworks public API",
    version: "1.0.0",
    summary: "Read-only access to the open map of out-of-home advertising.",
    description: [
      "Every published billboard, hoarding and screen on ohworks, with who sells it and what it costs, as JSON.",
      "",
      "- **Read-only and free.** No key is needed. Please keep to about one request a second.",
      "- **The owner is always the seller.** ohworks never sells media. To ask about a site, send the buyer to its `enquireUrl`; owners' contact details are never in the API.",
      "- **Same rules as the site.** A private price is `null`, an audience figure appears only with its source and date, and only checks a site has passed are listed.",
      "- **Versioned.** A change that breaks a field becomes `/api/v2/`.",
    ].join("\n"),
    contact: { name: "ohworks", email: "hello@ohworks.com", url: "https://ohworks.com" },
  },
  servers: [{ url: "/", description: "This site" }],
  // No key or sign-in: every operation is open.
  security: [],
  tags: [
    { name: "Sites", description: "Advertising faces, one record per face." },
    { name: "Reference", description: "The lists the filters use." },
    { name: "Service", description: "Whether the service is up." },
  ],
  paths: {
    "/api/v1/sites/": {
      get: {
        tags: ["Sites"],
        operationId: "listSites",
        summary: "Search sites",
        description:
          "Published sites, filtered and ordered exactly as the search page does. Parameters can be combined. Unknown or invalid values are ignored; `filters` in the answer shows what was applied.",
        parameters: [
          query(
            "q",
            { type: "string", maxLength: 200 },
            'Typed text, read the way the search box reads it: "20x10 hoardings in Bengaluru under 1 lakh" sets the size, format, city and price limit.',
          ),
          query("city", { type: "string", enum: slugs(CITIES) }),
          query(
            "locality",
            { type: "string" },
            "Locality slugs, separated by commas. Needs `city`.",
          ),
          query("format", commaList(slugs(FORMATS), "formats")),
          query("type", { type: "string", enum: ["static", "digital"] }),
          query(
            "size",
            { type: "string", pattern: "^\\d{1,3}(\\.\\d)?x\\d{1,3}(\\.\\d)?$" },
            "Width by height in feet, such as `20x10`.",
          ),
          query("lit", commaList(slugs(LIGHTING), "kinds of lighting")),
          query("min", { type: "integer", minimum: 1 }, "Lowest monthly price in rupees."),
          query(
            "max",
            { type: "integer", minimum: 1 },
            "Highest monthly price in rupees. Only sites that show a price can match a price limit.",
          ),
          query("priced", { type: "string", enum: ["1"] }, "`1` for sites that show a price."),
          query(
            "from",
            { type: "string", format: "date" },
            "Start of the campaign. A site booked on that date is left out.",
          ),
          query("to", { type: "string", format: "date" }, "End of the campaign."),
          query(
            "trust",
            commaList(
              TRUST.map((t) => t.key),
              "checks the site must have passed",
            ),
          ),
          query(
            "bbox",
            { type: "string", examples: ["77.5800,12.9000,77.6500,12.9800"] },
            "A map area: west, south, east, north, in degrees.",
          ),
          query("owner", { type: "string" }, "An owner's slug, for their sites only."),
          query("sort", { type: "string", enum: SORTS.map((s) => s.key), default: "best" }),
          query("page", { type: "integer", minimum: 1, default: 1 }),
          query("per_page", {
            type: "integer",
            minimum: 1,
            maximum: MAX_PER_PAGE,
            default: PER_PAGE,
          }),
        ],
        responses: {
          "200": {
            description: "A page of sites.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SiteList" } } },
          },
          "400": problemResponse("`per_page` is out of range."),
        },
      },
    },
    "/api/v1/sites/{unitId}/": {
      get: {
        tags: ["Sites"],
        operationId: "getSite",
        summary: "Get one site",
        description: "Everything the site's page shows. A draft or withdrawn site answers 404.",
        parameters: [
          {
            name: "unitId",
            in: "path",
            required: true,
            schema: { type: "string", pattern: "^[a-zA-Z0-9-]{1,40}$", examples: ["ows0001"] },
          },
        ],
        responses: {
          "200": {
            description: "The site.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SiteDetail" } },
            },
          },
          "404": problemResponse("No published site has this ID."),
        },
      },
    },
    "/api/v1/cities/": {
      get: {
        tags: ["Reference"],
        operationId: "listCities",
        summary: "List cities",
        description: "The cities ohworks lists sites in, with how many published sites each has.",
        responses: {
          "200": {
            description: "Every city.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["cities"],
                  properties: {
                    cities: { type: "array", items: { $ref: "#/components/schemas/City" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/formats/": {
      get: {
        tags: ["Reference"],
        operationId: "listFormats",
        summary: "List formats",
        description: "The kinds of face ohworks lists, with how many published sites each has.",
        responses: {
          "200": {
            description: "Every format.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["formats"],
                  properties: {
                    formats: { type: "array", items: { $ref: "#/components/schemas/Format" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/health/": {
      get: {
        tags: ["Service"],
        operationId: "health",
        summary: "Check the service",
        description: "Answers while the service is up. Used by the host's health checks.",
        responses: {
          "200": {
            description: "Up.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SiteSummary,
      SiteDetail,
      SiteList: {
        type: "object",
        required: ["page", "perPage", "total", "pages", "filters", "sites"],
        properties: {
          page: { type: "integer" },
          perPage: { type: "integer" },
          total: { type: "integer", description: "Sites matching, across all pages." },
          pages: { type: "integer" },
          filters: { $ref: "#/components/schemas/Filters" },
          sites: { type: "array", items: { $ref: "#/components/schemas/SiteSummary" } },
        },
      },
      Filters,
      City: {
        type: "object",
        required: ["slug", "label", "sites", "searchUrl"],
        properties: {
          slug: { type: "string", enum: slugs(CITIES) },
          label: { type: "string" },
          sites: { type: "integer" },
          searchUrl: { type: "string", format: "uri" },
        },
      },
      Format: {
        type: "object",
        required: ["slug", "label", "plural", "sites", "searchUrl"],
        properties: {
          slug: { type: "string", enum: slugs(FORMATS) },
          label: { type: "string" },
          plural: { type: "string" },
          sites: { type: "integer" },
          searchUrl: { type: "string", format: "uri" },
        },
      },
      Health: {
        type: "object",
        required: ["ok", "service", "time"],
        properties: {
          ok: { type: "boolean" },
          service: { type: "string", enum: ["web", "jobs"] },
          time: { type: "string", format: "date-time" },
        },
      },
      Problem: {
        type: "object",
        description: "What went wrong, in words (RFC 9457).",
        required: ["type", "title", "status", "detail"],
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          status: { type: "integer" },
          detail: { type: "string" },
        },
      },
    },
  },
};
