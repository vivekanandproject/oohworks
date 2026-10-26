// Puts oohworks.co in front of the Cloud Run `web` service. Cloudflare's Free plan cannot rewrite the
// Host header in an Origin Rule (Enterprise only), and Cloud Run answers only to its own hostname, so
// this Worker forwards each request instead. It keeps the visitor's headers (CF-Connecting-IP stays the
// visitor's address, which src/lib/forms.ts reads for rate limits), adds X-Origin-Secret for
// src/middleware.ts, and turns any redirect to the run.app address back into oohworks.co.
//
// Secret ORIGIN_SECRET: the value of the Secret Manager secret of the same name in project oohworks.
// Routes: oohworks.co/* and www.oohworks.co/*; www answers with a permanent redirect to oohworks.co.

const ORIGIN = "https://web-761327430968.asia-south1.run.app";
const RUN_APP = /^https:\/\/web-[a-z0-9-]+\.(?:asia-south1\.run\.app|a\.run\.app)/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.oohworks.co") {
      url.hostname = "oohworks.co";
      return Response.redirect(url.toString(), 301);
    }

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("X-Origin-Secret", env.ORIGIN_SECRET);
    headers.set("X-Forwarded-Host", url.host);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const response = await fetch(new URL(url.pathname + url.search, ORIGIN), {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
    });

    const location = response.headers.get("location");
    if (!location || !RUN_APP.test(location)) return response;
    const out = new Response(response.body, response);
    out.headers.set("location", location.replace(RUN_APP, url.origin));
    return out;
  },
};
