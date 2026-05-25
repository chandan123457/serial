import { z } from "zod";

export const loginSchema = z.object({
  role: z.enum(["admin", "user"]),
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
