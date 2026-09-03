import Link from "next/link";
import { WHATSAPP_CONTACT_HREF } from "@/lib/constants";

type WhatsAppContactLinkProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function WhatsAppContactLink({
  children,
  className = "",
  ariaLabel = "Contactar por WhatsApp",
}: WhatsAppContactLinkProps) {
  return (
    <Link
      href={WHATSAPP_CONTACT_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
