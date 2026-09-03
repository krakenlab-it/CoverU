import type { Metadata } from "next";
import { MARKETING_SITE_NAME } from "@/lib/constants";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_URL,
  absoluteUrl,
  pageTitle,
} from "@/lib/seo/site";

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  image?: string;
};

export function buildPublicMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  noIndex = false,
  image = DEFAULT_OG_IMAGE,
}: BuildMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const resolvedTitle = pageTitle(title);
  const ogImageUrl = image.startsWith("http") ? image : absoluteUrl(image);
  const twitterImageUrl = absoluteUrl(DEFAULT_TWITTER_IMAGE);

  return {
    title: title ?? "Comparador de seguros de salud",
    description,
    keywords: [...SITE_KEYWORDS],
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: canonical,
      siteName: MARKETING_SITE_NAME,
      title: resolvedTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${MARKETING_SITE_NAME} — comparador de seguros de salud en Ecuador`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [twitterImageUrl, ogImageUrl],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    metadataBase: new URL(SITE_URL),
  };
}

export function buildAppMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}
