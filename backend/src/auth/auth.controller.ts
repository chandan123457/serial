import type { Request, Response } from "express";
import { loginSchema } from "./auth.schemas.js";
import { loginWithRole } from "./auth.service.js";

export async function postLogin(request: Request, response: Response) {
  try {
    const payload = loginSchema.parse(request.body);
    const session = await loginWithRole(payload.role, payload.username, payload.password);
    response.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to login";
    response.status(400).json({ message });
  }
}
