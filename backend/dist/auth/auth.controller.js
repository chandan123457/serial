import { loginSchema } from "./auth.schemas.js";
import { loginWithRole } from "./auth.service.js";
export async function postLogin(request, response) {
    try {
        const payload = loginSchema.parse(request.body);
        const session = await loginWithRole(payload.role, payload.username, payload.password);
        response.json(session);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to login";
        response.status(400).json({ message });
    }
}
