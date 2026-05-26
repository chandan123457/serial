import { z } from "zod";

export const generateFpCodesSchema = z.object({
  sectionKey: z.string().min(1),
  operatorNumber: z.string().min(1),
  modelNumberId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(500),
  manufacturingDate: z.string().min(1),
  orderId: z.string().trim().min(1),
  rmCode: z.string().trim().min(1)
});

export const generateHpbCodesSchema = z.object({
  sectionKey: z.string().min(1),
  operatorNumber: z.string().min(1),
  orderId: z.string().trim().min(1),
  rmCode: z.string().trim().min(1)
});

export const generateBrazerCodesSchema = z.object({
  sectionKey: z.string().min(1),
  operatorNumber: z.string().min(1),
  orderId: z.string().trim().min(1),
  rmCode: z.string().trim().min(1)
});

export const generateLeakTestingCodesSchema = z.object({
  sectionKey: z.string().min(1),
  operatorNumber: z.string().min(1),
  orderId: z.string().trim().min(1),
  rmCode: z.string().trim().min(1)
});

export const getFpCodesByOrderSchema = z.object({
  sectionKey: z.string().min(1),
  orderId: z.string().trim().min(1),
  codeType: z.enum(["fp", "hpb", "br", "lt"]).default("fp")
});

export const updateCodeStatusesSchema = z.object({
  operatorNumber: z.string().min(1).optional(),
  codes: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["approved", "rejected"]).nullable()
    })
  )
});

export const generateInspectionSerialsSchema = z.object({
  sectionKey: z.string().min(1),
  orderId: z.string().trim().min(1),
  operatorNumber: z.string().min(1),
  inspectionNote: z.string().trim().min(1)
});

export const getBarcodeDetailsSchema = z.object({
  serialNumber: z.string().trim().min(1)
});
