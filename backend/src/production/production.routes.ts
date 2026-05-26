import { Router } from "express";
import {
  getFpCodes,
  getSerialBarcodeDetails,
  patchCodeStatuses,
  postGenerateBrazerCodes,
  postGenerateFpCodes,
  postGenerateHpbCodes,
  postGenerateInspectionSerials,
  postGenerateLeakTestingCodes
} from "./production.controller.js";

export const productionRouter = Router();

productionRouter.get("/fp-codes", getFpCodes);
productionRouter.post("/fp-codes", postGenerateFpCodes);
productionRouter.post("/hpb-codes", postGenerateHpbCodes);
productionRouter.post("/brazer-codes", postGenerateBrazerCodes);
productionRouter.post("/leak-testing-codes", postGenerateLeakTestingCodes);
productionRouter.post("/inspection-serials", postGenerateInspectionSerials);
productionRouter.get("/barcode-details/:serialNumber", getSerialBarcodeDetails);
productionRouter.patch("/operator-codes/statuses", patchCodeStatuses);
