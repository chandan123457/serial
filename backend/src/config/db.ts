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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS generated_code_batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_key TEXT NOT NULL,
      code_type TEXT NOT NULL,
      order_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (section_key, code_type, order_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS generated_operator_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id UUID REFERENCES generated_code_batches(id),
      serial BIGSERIAL NOT NULL UNIQUE,
      section_key TEXT NOT NULL,
      code_type TEXT NOT NULL,
      operator_number TEXT NOT NULL,
      model_number_id UUID,
      quantity INTEGER NOT NULL,
      manufacturing_date DATE NOT NULL,
      order_id TEXT NOT NULL,
      rm_code TEXT NOT NULL,
      status TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE generated_operator_codes
    ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES generated_code_batches(id);
  `);

  await pool.query(`
    ALTER TABLE generated_operator_codes
    DROP CONSTRAINT IF EXISTS generated_operator_codes_serial_key;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'generated_operator_codes_type_order_serial_key'
      ) THEN
        ALTER TABLE generated_operator_codes
        ADD CONSTRAINT generated_operator_codes_type_order_serial_key
        UNIQUE (section_key, code_type, order_id, serial);
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS generated_serial_numbers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      serial_index BIGSERIAL NOT NULL UNIQUE,
      serial_number TEXT UNIQUE,
      section_key TEXT NOT NULL,
      order_id TEXT NOT NULL,
      lt_code_id UUID NOT NULL REFERENCES generated_operator_codes(id),
      source_serial BIGINT NOT NULL,
      inspector_operator_number TEXT NOT NULL,
      inspection_note TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (section_key, order_id, lt_code_id)
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
