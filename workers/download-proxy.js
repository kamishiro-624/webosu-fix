const PROVIDERS = [
  (sid) => `https://api.nerinyan.moe/d/${sid}?noVideo=1`,
  (sid) => `https://osu.direct/d/${sid}`,
  (sid) => `https://catboy.best/d/${sid}`,
];

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "GET" || requestUrl.pathname !== "/api/download") {
      return new Response("Not found", { status: 404 });
    }

    const sid = requestUrl.searchParams.get("sid");
    if (!/^\d+$/.test(sid || "")) {
      return json({ error: "Invalid beatmap set id" }, 400);
    }

    let lastStatus = 502;
    for (const makeUrl of PROVIDERS) {
      try {
        const upstream = await fetch(makeUrl(sid), {
          headers: {
            Accept: "application/octet-stream",
            ...(request.headers.has("Range")
              ? { Range: request.headers.get("Range") }
              : {}),
          },
          redirect: "follow",
        });

        if (!upstream.ok) {
          lastStatus = upstream.status;
          continue;
        }

        const headers = new Headers(upstream.headers);
        headers.delete("set-cookie");
        headers.set("Cache-Control", "no-store");
        for (const [name, value] of Object.entries(corsHeaders())) {
          headers.set(name, value);
        }

        return new Response(upstream.body, {
          status: upstream.status,
          headers,
        });
      } catch {
        // Try the next provider from the edge rather than exposing provider errors.
      }
    }

    return json({ error: "No beatmap provider responded" }, lastStatus);
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Type",
  };
}

function json(value, status) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}
