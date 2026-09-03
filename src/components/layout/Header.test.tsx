import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "@/components/layout/Header";
import { WHATSAPP_CONTACT_HREF } from "@/lib/constants";

describe("Header", () => {
  it("shows Astro-style nav links and CTAs", () => {
    render(<Header />);

    const desktopNav = screen.getByRole("navigation", {
      name: "Navegación principal",
    });

    expect(desktopNav.querySelector('a[href="/agentes"]')).toHaveTextContent(
      "Agentes",
    );
    expect(desktopNav.querySelector('a[href="/nosotros"]')).toHaveTextContent(
      "Nosotros",
    );
    expect(desktopNav.querySelector('a[href="/faqs"]')).toHaveTextContent("FAQs");
    expect(desktopNav.querySelector('a[href="/contacto"]')).toHaveTextContent(
      "Contact",
    );
    expect(screen.getAllByRole("link", { name: "Iniciar sesión" })[0]).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Quiero Asegurarme por WhatsApp" })).toHaveAttribute(
      "href",
      WHATSAPP_CONTACT_HREF,
    );
    expect(screen.getByRole("link", { name: "Cover U — inicio" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
