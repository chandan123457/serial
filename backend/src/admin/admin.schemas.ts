import { z } from "zod";
import { operatorTypeMap } from "./admin.constants.js";

const operatorTypeKeys = Object.keys(operatorTypeMap) as [
  keyof typeof operatorTypeMap,
  ...(keyof typeof operatorTypeMap)[]
];

export const createUserSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  operatorType: z.enum(operatorTypeKeys),
  operatorNumber: z.string().trim().min(1, "Operator number is required")
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid("Invalid user id")
});

export const createModelSchema = z.object({
  modelNumber: z.string().trim().min(1, "Model number is required")
});

export const deleteUserSchema = z.object({
  id: z.string().uuid("Invalid user id")
});

export const deleteModelSchema = z.object({
  id: z.string().uuid("Invalid model id")
});
