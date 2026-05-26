import type { Request, Response } from "express";
import {
  generateBrazerCodesSchema,
  generateFpCodesSchema,
  generateHpbCodesSchema,
  generateInspectionSerialsSchema,
  generateLeakTestingCodesSchema,
  getBarcodeDetailsSchema,
  getFpCodesByOrderSchema,
  updateCodeStatusesSchema
} from "./production.schemas.js";
import {
  generateInspectionSerials,
  generateBrazerCodes,
  generateFpCodes,
  generateHpbCodes,
  generateLeakTestingCodes,
  getBarcodeDetails,
  getFpCodesByOrder,
  updateCodeStatuses
} from "./production.service.js";

function handleError(error: unknown, response: Response) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  response.status(400).json({ message });
}

export async function postGenerateFpCodes(request: Request, response: Response) {
  try {
    const payload = generateFpCodesSchema.parse(request.body);
    const result = await generateFpCodes({
      ...payload,
      modelNumberId: payload.modelNumberId || undefined
    });

    response.status(result.existing ? 200 : 201).json(result);
  } catch (error) {
    handleError(error, response);
  }
}

export async function getFpCodes(request: Request, response: Response) {
  try {
    const payload = getFpCodesByOrderSchema.parse(request.query);
    const codes = await getFpCodesByOrder(payload);

    response.json({ exists: codes.length > 0, codes });
  } catch (error) {
    handleError(error, response);
  }
}

export async function postGenerateHpbCodes(request: Request, response: Response) {
  try {
    const payload = generateHpbCodesSchema.parse(request.body);
    const result = await generateHpbCodes(payload);

    response.status(result.existing ? 200 : 201).json(result);
  } catch (error) {
    handleError(error, response);
  }
}

export async function postGenerateBrazerCodes(request: Request, response: Response) {
  try {
    const payload = generateBrazerCodesSchema.parse(request.body);
    const result = await generateBrazerCodes(payload);

    response.status(result.existing ? 200 : 201).json(result);
  } catch (error) {
    handleError(error, response);
  }
}

export async function postGenerateLeakTestingCodes(request: Request, response: Response) {
  try {
    const payload = generateLeakTestingCodesSchema.parse(request.body);
    const result = await generateLeakTestingCodes(payload);

    response.status(result.existing ? 200 : 201).json(result);
  } catch (error) {
    handleError(error, response);
  }
}

export async function patchCodeStatuses(request: Request, response: Response) {
  try {
    const payload = updateCodeStatusesSchema.parse(request.body);
    const codes = await updateCodeStatuses(payload.codes);

    response.json({ codes });
  } catch (error) {
    handleError(error, response);
  }
}

export async function postGenerateInspectionSerials(request: Request, response: Response) {
  try {
    const payload = generateInspectionSerialsSchema.parse(request.body);
    const serials = await generateInspectionSerials(payload);

    response.status(201).json({ serials });
  } catch (error) {
    handleError(error, response);
  }
}

export async function getSerialBarcodeDetails(request: Request, response: Response) {
  try {
    const payload = getBarcodeDetailsSchema.parse(request.params);
    const details = await getBarcodeDetails(payload.serialNumber);

    if (!details) {
      response.status(404).json({ message: "Serial number not found" });
      return;
    }

    response.json(details);
  } catch (error) {
    handleError(error, response);
  }
}
