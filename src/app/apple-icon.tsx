import { loadPublicAssetBody } from "@/lib/brand/load-public-asset";
import { FAVICON_ASSETS } from "@/lib/brand/assets";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const staticIcon = loadPublicAssetBody(FAVICON_ASSETS.appleTouchIcon.slice(1));

  if (staticIcon) {
    return new Response(staticIcon, {
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
          fontSize: 96,
          fontWeight: 700,
          borderRadius: 36,
        }}
      >
        Ü
      </div>
    ),
    { ...size },
  );
}
