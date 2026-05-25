import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
