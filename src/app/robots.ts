import type { MetadataRoute } from "next";
import { SITE_URL } from "@/services/site-url";

/**
 * robots.txt.
 *
 * Herkese acik profiller taranmali -- urunun paylasilan yuzu onlar.
 * Uygulamanin kendi ekranlari taranmamali: giris gerektiriyorlar ve
 * kaziyici oralarda yalnizca bos bir kabuk goruyor, cunku koruma
 * istemci tarafinda. Bu kabuklar dizine girerse arama sonuclarinda
 * profillerle yarisirlar.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/*/admin-panel",
        "/*/analytics",
        "/*/dashboard",
        "/*/links",
        "/*/onboarding",
        "/*/profile",
        "/*/settings",
        "/*/sign-in",
        "/*/sign-up",
        "/*/forgot-password",
        "/*/password-change",
        "/*/confirm-email",
      ],
    },
    // Profiller birbirine bagli degil; kaziyici onlari sitemap olmadan
    // ancak disaridan gelen bir baglantiyla bulabiliyor.
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
