import { internalDocsShown } from "@/lib/api/env";

export const dynamic = "force-dynamic";

/**
 * The API documentation: Swagger UI, served from this site's own files (scripts/copy-swagger-ui.mjs).
 * It offers the public API everywhere and, outside production, the internal reference as well.
 */
export function GET(): Response {
  const specs = [
    { url: "/api/v1/openapi.json", name: "Public API v1" },
    ...(internalDocsShown()
      ? [{ url: "/api/internal/openapi.json", name: "Internal reference (not in production)" }]
      : []),
  ];
  const config = {
    urls: specs,
    "urls.primaryName": specs[0]?.name,
    dom_id: "#swagger-ui",
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 0,
    tryItOutEnabled: true,
    layout: "StandaloneLayout",
  };
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>OOHWORKS API</title>
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/vendor/swagger-ui/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f6f5f2; }
      .swagger-ui .topbar { background: #101c30; }
      .swagger-ui .topbar .download-url-wrapper .select-label { color: #f6f5f2; }
      .swagger-ui .topbar-wrapper a { pointer-events: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/vendor/swagger-ui/swagger-ui-bundle.js"></script>
    <script src="/vendor/swagger-ui/swagger-ui-standalone-preset.js"></script>
    <script>
      const config = ${JSON.stringify(config)};
      window.ui = SwaggerUIBundle({
        ...config,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      });
    </script>
  </body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
