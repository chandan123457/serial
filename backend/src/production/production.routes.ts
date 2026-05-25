import { Router } from "express";
import {
  getFpCodes,
  patchCodeStatuses,
  postGenerateFpCodes,
  postGenerateHpbCodes
} from "./production.controller.js";

export const productionRouter = Router();

productionRouter.get("/fp-codes", getFpCodes);
productionRouter.post("/fp-codes", postGenerateFpCodes);
productionRouter.post("/hpb-codes", postGenerateHpbCodes);
productionRouter.patch("/operator-codes/statuses", patchCodeStatuses);
