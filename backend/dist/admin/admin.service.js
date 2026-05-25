import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { operatorTypeMap } from "./admin.constants.js";
function assertOperatorNumber(operatorType, operatorNumber) {
    const allowed = operatorTypeMap[operatorType].values;
    if (!allowed.includes(operatorNumber)) {
        throw new Error("Invalid operator number for selected operator type");
    }
}
export async function listUsers() {
    const result = await pool.query(`SELECT id, username, operator_type_key AS "operatorType", operator_type_label AS "operatorTypeLabel",
            operator_number AS "operatorNumber", created_at AS "createdAt"
     FROM admin_users
     ORDER BY created_at DESC, username ASC`);
    return result.rows;
}
export async function createUser(input) {
    assertOperatorNumber(input.operatorType, input.operatorNumber);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const label = operatorTypeMap[input.operatorType].label;
    const result = await pool.query(`INSERT INTO admin_users (
      username, password_hash, operator_type_key, operator_type_label, operator_number
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, operator_type_key AS "operatorType",
      operator_type_label AS "operatorTypeLabel",
      operator_number AS "operatorNumber", created_at AS "createdAt"`, [input.username, passwordHash, input.operatorType, label, input.operatorNumber]);
    return result.rows[0];
}
export async function updateUser(input) {
    const currentResult = await pool.query(`SELECT operator_type_key AS "operatorType" FROM admin_users WHERE id = $1`, [input.id]);
    if (!currentResult.rowCount) {
        throw new Error("User not found");
    }
    const operatorType = (input.operatorType ??
        currentResult.rows[0].operatorType);
    const operatorNumber = input.operatorNumber;
    if (operatorNumber) {
        assertOperatorNumber(operatorType, operatorNumber);
    }
    const updates = [];
    const values = [];
    let index = 1;
    if (input.username) {
        updates.push(`username = $${index++}`);
        values.push(input.username);
    }
    if (input.password) {
        const passwordHash = await bcrypt.hash(input.password, 10);
        updates.push(`password_hash = $${index++}`);
        values.push(passwordHash);
    }
    if (input.operatorType) {
        updates.push(`operator_type_key = $${index++}`);
        values.push(input.operatorType);
        updates.push(`operator_type_label = $${index++}`);
        values.push(operatorTypeMap[input.operatorType].label);
    }
    if (input.operatorNumber) {
        updates.push(`operator_number = $${index++}`);
        values.push(input.operatorNumber);
    }
    updates.push(`updated_at = NOW()`);
    values.push(input.id);
    const result = await pool.query(`UPDATE admin_users
     SET ${updates.join(", ")}
     WHERE id = $${index}
     RETURNING id, username, operator_type_key AS "operatorType",
      operator_type_label AS "operatorTypeLabel",
      operator_number AS "operatorNumber", created_at AS "createdAt"`, values);
    return result.rows[0];
}
export async function deleteUser(id) {
    await pool.query(`DELETE FROM admin_users WHERE id = $1`, [id]);
}
export async function listModelNumbers() {
    const result = await pool.query(`SELECT id, model_number AS "modelNumber", created_at AS "createdAt"
     FROM admin_model_numbers
     ORDER BY created_at DESC, model_number ASC`);
    return result.rows;
}
export async function createModelNumber(modelNumber) {
    const result = await pool.query(`INSERT INTO admin_model_numbers (model_number)
     VALUES ($1)
     RETURNING id, model_number AS "modelNumber", created_at AS "createdAt"`, [modelNumber]);
    return result.rows[0];
}
export async function deleteModelNumber(id) {
    await pool.query(`DELETE FROM admin_model_numbers WHERE id = $1`, [id]);
}
export function listOperatorTypes() {
    return Object.entries(operatorTypeMap).map(([key, value]) => ({
        key,
        label: value.label,
        values: value.values
    }));
}
export async function findUserByUsername(username) {
    const result = await pool.query(`SELECT id, username, password_hash AS "passwordHash",
      operator_type_key AS "operatorType", operator_type_label AS "operatorTypeLabel",
      operator_number AS "operatorNumber"
     FROM admin_users
     WHERE LOWER(username) = LOWER($1)`, [username]);
    return result.rows[0] ?? null;
}
