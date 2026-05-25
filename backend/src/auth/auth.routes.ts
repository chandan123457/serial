import { Router } from "express";
import { postLogin } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", postLogin);
