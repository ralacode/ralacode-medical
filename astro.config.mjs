// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"

import { remarkFixEmphasis } from "./src/lib/emphasis.ts"

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
  ],
  prefetch: true,
  devToolbar: {
    enabled: false,
  },
})
