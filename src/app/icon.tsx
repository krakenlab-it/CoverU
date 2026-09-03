import { loadPublicAssetBody } from "@/lib/brand/load-public-asset";
import { FAVICON_ASSETS } from "@/lib/brand/assets";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const faviconIco = loadPublicAssetBody("favicon.ico");
  if (faviconIco) {
    return new Response(faviconIco, {
      headers: { "Content-Type": "image/x-icon" },
    });
  }

  const icon192 = loadPublicAssetBody(FAVICON_ASSETS.icon192.slice(1));
  if (icon192) {
    return new Response(icon192, {
      headers: { "Content-Type": "image/png" },
    });
  }

  const markPng = loadPublicAssetBody("brand/mark.png");
  if (markPng) {
    return new Response(markPng, {
      headers: { "Content-Type": "image/png" },
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#df0926",
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 8,
        }}
      >
        Ü
      </div>
    ),
    { ...size },
  );
}
