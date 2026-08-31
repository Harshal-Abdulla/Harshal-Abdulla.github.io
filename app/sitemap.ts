import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/profile";
import { PROJECTS } from "@/content/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/about/",
    ...PROJECTS.map((p) => `/work/${p.slug}/`),
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));
}
