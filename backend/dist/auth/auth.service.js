import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { findUserByUsername } from "../admin/admin.service.js";
async function findAdminByUsername(username) {
    const result = await pool.query(`SELECT id, username, password_hash AS "passwordHash"
     FROM admin_accounts
     WHERE LOWER(username) = LOWER($1)`, [username]);
    return result.rows[0] ?? null;
}
export async function loginWithRole(role, username, password) {
    if (role === "admin") {
        const admin = await findAdminByUsername(username);
        if (!admin) {
            throw new Error("Invalid admin username or password");
        }
        const matches = await bcrypt.compare(password, admin.passwordHash);
        if (!matches) {
            throw new Error("Invalid admin username or password");
        }
        return {
            role: "admin",
            user: {
                id: admin.id,
                username: admin.username
            }
        };
    }
    const user = await findUserByUsername(username);
    if (!user) {
        throw new Error("Invalid user username or password");
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
        throw new Error("Invalid user username or password");
    }
    return {
        role: "user",
        user: {
            id: user.id,
            username: user.username,
            operatorType: user.operatorType,
            operatorTypeLabel: user.operatorTypeLabel,
            operatorNumber: user.operatorNumber
        }
    };
}
