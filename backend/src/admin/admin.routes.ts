import { Router } from "express";
import {
  getAdminBootstrap,
  patchUser,
  postModelNumber,
  postUser,
  removeModelNumber,
  removeUser
} from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.get("/bootstrap", getAdminBootstrap);
adminRouter.post("/users", postUser);
adminRouter.patch("/users/:id", patchUser);
adminRouter.delete("/users/:id", removeUser);
adminRouter.post("/model-numbers", postModelNumber);
adminRouter.delete("/model-numbers/:id", removeModelNumber);
