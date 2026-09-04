import { VISUAL_PACK_MARKETING } from "@/lib/visual-pack/assets";

export const HERO_SLIDES = [
  {
    id: "demo-clarity",
    image: VISUAL_PACK_MARKETING.heroCoveru,
    imageAlt:
      "Compara coberturas con claridad — experiencia Demo para ordenar opciones de seguros en Ecuador",
    headline: "Compara coberturas con claridad.",
    highlight: "",
    subheadline:
      "Una experiencia Demo para ordenar opciones de seguros en Ecuador — sin ruido.",
  },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    image: "/marketing/step-profile.webp",
    imageAlt: "Ingresa tu perfil para encontrar el plan ideal",
    text: "Ingresa tu perfil, existe un seguro y un plan ideal para ti.",
  },
  {
    number: 2,
    image: "/marketing/step-online.webp",
    imageAlt: "Compara seguros y planes en línea",
    text: "Compara en línea todos los seguros y planes existentes",
  },
  {
    number: 3,
    image: "/marketing/step-click.webp",
    imageAlt: "Solicita tu mejor opción con un clic",
    text: "Solicita con un click tu mejor opción, es",
    highlight: "gratis!",
  },
] as const;

export const BENTO_CARDS = [
  {
    id: "clarity",
    title: "Claridad",
    description:
      "Estructura ordenada para revisar opciones sin ruido. Datos Demo claramente identificados.",
    image: VISUAL_PACK_MARKETING.bentoClarity,
    imageAlt: "Claridad — estructura ordenada Demo",
    variant: "glass" as const,
    cta: { label: "Explorar Demo", href: "/comparar" },
  },
  {
    id: "compare",
    title: "Comparar",
    description:
      "Columnas alineadas para contrastar coberturas lado a lado. Sin logos de aseguradoras ni precios en Demo.",
    image: VISUAL_PACK_MARKETING.bentoCompare,
    imageAlt: "Comparar — columnas alineadas Demo",
    variant: "primary" as const,
    cta: { label: "Comparar planes", href: "/comparar" },
  },
  {
    id: "trust",
    title: "Confianza",
    description:
      "Sistema visible con controles claros. Mismo panel, menos ruido — experiencia Demo.",
    image: VISUAL_PACK_MARKETING.bentoTrust,
    imageAlt: "Confianza — sistema visible Demo",
    variant: "glass" as const,
    cta: { label: "Ver sistema", href: "/login" },
  },
] as const;

export const MEMBER_LOGOS = [
  {
    src: "/marketing/member-logo-1.webp",
    alt: "Logo de socio aliado",
  },
  {
    src: "/marketing/member-logo-2.webp",
    alt: "Logo de socio aliado",
  },
] as const;

export const TESTIMONIALS = [
  {
    id: "placeholder-1",
    name: "Espacio para testimonio",
    role: "Cliente Cover U",
    image: "/marketing/testimonial-1.png",
    quote:
      "Próximamente compartiremos experiencias reales de personas que compararon y contrataron con Cover U.",
    rating: 0,
  },
  {
    id: "placeholder-2",
    name: "Espacio para testimonio",
    role: "Cliente Cover U",
    image: "/marketing/testimonial-2.png",
    quote:
      "Estamos recopilando historias de usuarios. Si ya usaste Cover U, cuéntanos tu experiencia en contacto.",
    rating: 0,
  },
] as const;

export const MARKETING_FAQS = [
  {
    question: "¿Cuánto tiempo tarda el proceso de cotización?",
    answer:
      "En la mayoría de los casos puedes ver opciones comparables en minutos después de ingresar tu perfil (edad, género y región). La contratación final depende de la aseguradora seleccionada.",
  },
  {
    question: "¿Los precios mostrados son definitivos?",
    answer:
      "Los valores que ves son referenciales según tu perfil. La prima final puede variar tras la evaluación de la aseguradora. En modo demostración mostramos datos de ejemplo claramente identificados.",
  },
  {
    question: "¿Necesito crear una cuenta para comparar?",
    answer:
      "Puedes explorar y comparar planes sin cuenta. Para guardar preferencias, acceder al panel y solicitar seguimiento, te pedimos iniciar sesión.",
  },
] as const;
