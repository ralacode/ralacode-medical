// @ts-check

import { copyFile } from "node:fs/promises"

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"

import { remarkFixEmphasis } from "./src/lib/emphasis.ts"

/** @astrojs/sitemap は index 形式だけ出す。Search Console 向けに urlset を sitemap.xml へ複製する。 */
function copySitemapXml() {
  /** @type {import("astro").AstroIntegration} */
  const integration = {
    name: "copy-sitemap-xml",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        await copyFile(new URL("sitemap-0.xml", dir), new URL("sitemap.xml", dir))
        logger.info("Copied sitemap-0.xml to sitemap.xml")
      },
    },
  }
  return integration
}

// https://astro.build/config
export default defineConfig({
  site: "https://ralacode.com",
  base: "/medical/",
  markdown: {
    remarkPlugins: [remarkFixEmphasis],
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/test"),
    }),
    copySitemapXml(),
  ],
  prefetch: true,
  devToolbar: {
    enabled: false,
  },
})
