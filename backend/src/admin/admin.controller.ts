import type { Request, Response } from "express";
import {
  createModelSchema,
  createUserSchema,
  deleteModelSchema,
  deleteUserSchema,
  updateUserSchema
} from "./admin.schemas.js";
import {
  createModelNumber,
  createUser,
  deleteModelNumber,
  deleteUser,
  listModelNumbers,
  listOperatorTypes,
  listUsers,
  updateUser
} from "./admin.service.js";

function handleError(error: unknown, response: Response) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  response.status(400).json({ message });
}

export async function getAdminBootstrap(_: Request, response: Response) {
  const [users, modelNumbers] = await Promise.all([listUsers(), listModelNumbers()]);

  response.json({
    users,
    modelNumbers,
    operatorTypes: listOperatorTypes()
  });
}

export async function postUser(request: Request, response: Response) {
  try {
    const payload = createUserSchema.parse(request.body);
    const user = await createUser(payload);
    response.status(201).json(user);
  } catch (error) {
    handleError(error, response);
  }
}

export async function patchUser(request: Request, response: Response) {
  try {
    const payload = updateUserSchema.parse({
      ...request.body,
      id: request.params.id
    });
    const user = await updateUser(payload);
    response.json(user);
  } catch (error) {
    handleError(error, response);
  }
}

export async function removeUser(request: Request, response: Response) {
  try {
    const payload = deleteUserSchema.parse({ id: request.params.id });
    await deleteUser(payload.id);
    response.status(204).send();
  } catch (error) {
    handleError(error, response);
  }
}

export async function postModelNumber(request: Request, response: Response) {
  try {
    const payload = createModelSchema.parse(request.body);
    const model = await createModelNumber(payload.modelNumber);
    response.status(201).json(model);
  } catch (error) {
    handleError(error, response);
  }
}

export async function removeModelNumber(request: Request, response: Response) {
  try {
    const payload = deleteModelSchema.parse({ id: request.params.id });
    await deleteModelNumber(payload.id);
    response.status(204).send();
  } catch (error) {
    handleError(error, response);
  }
}
