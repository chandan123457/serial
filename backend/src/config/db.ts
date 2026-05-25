import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { env } from "./env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});

export async function initializeDatabase() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      operator_type_key TEXT NOT NULL,
      operator_type_label TEXT NOT NULL,
      operator_number TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_model_numbers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      model_number TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const defaultAdminUsername = "PPC";
  const defaultAdminPassword = "pragya@123";
  const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);

  await pool.query(
    `
      INSERT INTO admin_accounts (username, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          updated_at = NOW()
    `,
    [defaultAdminUsername, passwordHash]
  );
}
