import { Router } from "express";
import {
  getFpCodes,
  patchCodeStatuses,
  postGenerateBrazerCodes,
  postGenerateFpCodes,
  postGenerateHpbCodes,
  postGenerateLeakTestingCodes
} from "./production.controller.js";

export const productionRouter = Router();

productionRouter.get("/fp-codes", getFpCodes);
productionRouter.post("/fp-codes", postGenerateFpCodes);
productionRouter.post("/hpb-codes", postGenerateHpbCodes);
productionRouter.post("/brazer-codes", postGenerateBrazerCodes);
productionRouter.post("/leak-testing-codes", postGenerateLeakTestingCodes);
productionRouter.patch("/operator-codes/statuses", patchCodeStatuses);
