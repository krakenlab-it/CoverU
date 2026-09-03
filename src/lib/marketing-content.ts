export const HERO_SLIDES = [
  {
    id: "salud",
    image: "/marketing/hero-family.webp",
    imageAlt: "Encuentra el Seguro de Salud ideal y contrátalo 100% Online",
    headline: "Encuentra el Seguro de Salud ideal y contrátalo",
    highlight: "100% Online",
    subheadline:
      "Te ayudamos a encontrar eso que realmente necesitas. ¡Sin letra chica, fácil y seguro!",
  },
  {
    id: "empresa",
    image: "/marketing/hero-family.webp",
    imageAlt: "Seguros de empresa",
    headline: "Seguros de empresa",
    highlight: "",
    subheadline:
      "Te ayudamos a encontrar eso que realmente necesitas. ¡Sin letra chica, fácil y seguro!",
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
    id: "easy",
    title: "La forma más fácil de asegurarte",
    description:
      "Compara planes de salud con precios claros y sin letra chica. Crea tu cuenta o explora opciones en minutos.",
    image: "/marketing/bento-easy.webp",
    imageAlt: "Persona protegida con un escudo de seguro",
    variant: "primary" as const,
    cta: { label: "Cotizar", href: "/comparar" },
    secondaryCta: { label: "Iniciar sesión", href: "/login" },
  },
  {
    id: "copago",
    title: "Copago Cero",
    description:
      "Encuentra planes con copago reducido o cero en prestaciones clave, según tu perfil y región.",
    image: "/marketing/bento-copago.webp",
    imageAlt: "Tarjeta de beneficios de salud",
    variant: "glass" as const,
  },
  {
    id: "colaboradores",
    title: "Beneficios para tus colaboradores",
    description:
      "Soluciones para equipos: compara coberturas empresariales y solicita asesoría para tu organización.",
    image: "/marketing/bento-beneficios.webp",
    imageAlt: "Equipo de trabajo con protección de seguro",
    variant: "glass" as const,
  },
  {
    id: "vida",
    title: "Seguro de Vida Temporal",
    description:
      "Protege a quienes más importan con coberturas de vida temporal. Cotiza en línea y elige el plazo que necesitas.",
    image: "/marketing/bento-vida.webp",
    imageAlt: "Adulto mayor con protección de seguro de vida",
    variant: "primary" as const,
    cta: { label: "Cotizar", href: "/comparar" },
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
