import type { APIRoute } from "astro"

import { withBase } from "@/lib/paths"

function robotsTxt(sitemapURL: string) {
  return `User-agent: *
Allow: ${withBase()}

Disallow: ${withBase("test/")}

Sitemap: ${sitemapURL}
`
}

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    return new Response("Set `site` in astro.config.mjs.", { status: 500 })
  }

  const sitemapURL = new URL(withBase("sitemap-index.xml"), site).href

  return new Response(robotsTxt(sitemapURL), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
