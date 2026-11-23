import { z } from "zod";
import { TARIFF_REGION_VALUES } from "@/lib/catalog-enums";
import {
  QUOTE_AGE_MAX,
  QUOTE_AGE_MIN,
  QUOTE_GENDERS,
} from "@/lib/quoters/types";

export const leadSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  email: z.string().email("Email inválido").max(320),
  phone: z.string().max(30).optional(),
  age: z.number().int().min(18).max(99).optional(),
  gender: z.string().max(20).optional(),
  region: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
  plan_interest: z.string().max(2000).optional(),
});

/**
 * Public quoter query. The matrix `any` gender row is not a user choice, so
 * only the two selectable genders are accepted here.
 */
export const compareQuerySchema = z.object({
  age: z.coerce
    .number()
    .int()
    .min(QUOTE_AGE_MIN, `La edad debe ser al menos ${QUOTE_AGE_MIN}`)
    .max(QUOTE_AGE_MAX, `La edad no puede superar ${QUOTE_AGE_MAX}`),
  gender: z.enum(QUOTE_GENDERS),
  region: z.enum(TARIFF_REGION_VALUES),
});

export type CompareQuery = z.infer<typeof compareQuerySchema>;

export const signupSchema = z.object({
  email: z.string().email("Email inválido").max(320),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  organizationName: z
    .string()
    .min(1, "Nombre de organización requerido")
    .max(200),
});
