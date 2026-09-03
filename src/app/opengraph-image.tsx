import { loadPublicAssetBody } from "@/lib/brand/load-public-asset";
import { SOCIAL_ASSETS } from "@/lib/brand/assets";
import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/seo/site";

export const alt = "CoverÜ — comparador de seguros de salud en Ecuador";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const staticOg =
    loadPublicAssetBody(SOCIAL_ASSETS.openGraph.slice(1)) ??
    loadPublicAssetBody(SOCIAL_ASSETS.twitter.slice(1));

  if (staticOg) {
    return new Response(staticOg, {
      headers: { "Content-Type": "image/png" },
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 55%, #fee2e2 100%)",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#df0926",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Ü
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Cover<span style={{ color: "#df0926" }}>Ü</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            Comparador de seguros de salud en Ecuador
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 24,
              color: "#4b5563",
              lineHeight: 1.4,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 18, color: "#6b7280" }}>
          Datos de demostración · Sin ofertas comerciales
        </div>
      </div>
    ),
    { ...size },
  );
}
