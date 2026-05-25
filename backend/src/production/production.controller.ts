import type { Request, Response } from "express";
import {
  generateFpCodesSchema,
  getFpCodesByOrderSchema,
  updateCodeStatusesSchema
} from "./production.schemas.js";
import {
  generateFpCodes,
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

export async function patchCodeStatuses(request: Request, response: Response) {
  try {
    const payload = updateCodeStatusesSchema.parse(request.body);
    const codes = await updateCodeStatuses(payload.codes);

    response.json({ codes });
  } catch (error) {
    handleError(error, response);
  }
}
