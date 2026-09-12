const FALLBACK_URL = "https://cmr-for-blogs.vercel.app"

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BLOG_URL ??
  FALLBACK_URL
).replace(/\/+$/, "")

export const SITE_NAME = "Mini Blog — The Journal"

export const AUTHOR_NAME = "Avinash Potnuru"

export const AUTHOR_URL = "https://avinashpotnuruportfolio.netlify.app/"

export const SITE_DESCRIPTION =
  "Field notes on development, design, and the long, patient work of building for the web."