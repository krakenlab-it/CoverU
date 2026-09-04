-- KLM-60: Set logo_url for v1.3 catalog insurers (BMI, Confiamed, Saludsa).
-- Assets live in public/insurers/ — see public/insurers/USAGE.md.

UPDATE public.insurers
SET logo_url = '/insurers/bmi.png'
WHERE slug = 'bmi' AND (logo_url IS NULL OR logo_url = '');

UPDATE public.insurers
SET logo_url = '/insurers/confiamed.png'
WHERE slug = 'confiamed' AND (logo_url IS NULL OR logo_url = '');

UPDATE public.insurers
SET logo_url = '/insurers/saludsa.svg'
WHERE slug = 'saludsa' AND (logo_url IS NULL OR logo_url = '');

COMMENT ON COLUMN public.insurers.logo_url IS
  'Optional insurer logo URL (public path). v1.3 carriers: /insurers/bmi.png, /insurers/confiamed.png, /insurers/saludsa.svg.';
