import { Router } from "express";
import {
  getFpCodes,
  patchCodeStatuses,
  postGenerateBrazerCodes,
  postGenerateFpCodes,
  postGenerateHpbCodes
} from "./production.controller.js";

export const productionRouter = Router();

productionRouter.get("/fp-codes", getFpCodes);
productionRouter.post("/fp-codes", postGenerateFpCodes);
productionRouter.post("/hpb-codes", postGenerateHpbCodes);
productionRouter.post("/brazer-codes", postGenerateBrazerCodes);
productionRouter.patch("/operator-codes/statuses", patchCodeStatuses);
