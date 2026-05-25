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

export const getFpCodesByOrderSchema = z.object({
  sectionKey: z.string().min(1),
  orderId: z.string().trim().min(1),
  codeType: z.enum(["fp", "hpb"]).default("fp")
});

export const updateCodeStatusesSchema = z.object({
  codes: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["approved", "rejected"]).nullable()
    })
  )
});
