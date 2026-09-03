import { z } from "zod";

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

export const compareQuerySchema = z.object({
  age: z.coerce.number().int().min(18).max(99),
  gender: z.enum(["femenino", "masculino"]),
  region: z.string().min(1).max(50),
});

export const signupSchema = z.object({
  email: z.string().email("Email inválido").max(320),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  organizationName: z
    .string()
    .min(1, "Nombre de organización requerido")
    .max(200),
});
