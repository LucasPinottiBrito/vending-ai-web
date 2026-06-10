import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const topupSchema = z.object({
  amount_cents: z.coerce
    .number()
    .int("Use valores inteiros em centavos.")
    .min(100, "Valor mínimo de recarga é R$ 1,00 (100 centavos).")
    .positive("Informe um valor positivo."),
});

export const productSchema = z.object({
  sku: z.string().min(2, "Informe o SKU."),
  name: z.string().min(2, "Informe o nome."),
  description: z.string().optional(),
  category: z.string().optional(),
  price_cents: z.coerce.number().int().min(0, "Preco invalido."),
  is_active: z.boolean().default(true),
});

export const machineSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "Use letras minusculas, numeros e hifens."),
  name: z.string().min(2, "Informe o nome."),
  location: z.string().min(2, "Informe a localizacao."),
  status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE", "ERROR"]),
});

export const slotSchema = z.object({
  code: z.string().min(1, "Informe o código do slot."),
  motor_id: z.coerce.number().int().min(0, "Motor ID inválido."),
  sensor_column_id: z.coerce.number().int().min(0, "Sensor ID inválido."),
  is_enabled: z.boolean().default(true),
});

export const inventorySchema = z.object({
  machine_id: z.coerce.number().int().positive("Selecione uma máquina."),
  slot_id: z.coerce.number().int().positive("Selecione um slot."),
  product_id: z.coerce.number().int().positive("Selecione um produto."),
  quantity_available: z.coerce.number().int().min(0, "A quantidade não pode ser negativa."),
  quantity_reserved: z.coerce.number().int().min(0).default(0),
  min_quantity_alert: z.coerce.number().int().min(0, "O alerta deve ser positivo.").default(0),
});

export const reportFilterSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  machine_id: z.string().optional(),
  status: z.string().optional(),
});

export const chartFilterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});
