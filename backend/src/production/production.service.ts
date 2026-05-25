import { pool } from "../config/db.js";

type GenerateFpCodesInput = {
  sectionKey: string;
  operatorNumber: string;
  modelNumberId?: string;
  quantity: number;
  manufacturingDate: string;
  orderId: string;
  rmCode: string;
};

type GetFpCodesByOrderInput = {
  sectionKey: string;
  orderId: string;
  codeType?: "fp" | "hpb" | "br" | "lt";
};

type GenerateHpbCodesInput = {
  sectionKey: string;
  operatorNumber: string;
  orderId: string;
  rmCode: string;
};

type GenerateDerivedCodesInput = GenerateHpbCodesInput & {
  sourceCodeType: "fp" | "hpb" | "br";
  targetCodeType: "hpb" | "br" | "lt";
  sourceStatus?: "approved";
};

function mapCodeRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    serial: row.serial,
    status: row.status,
    operatorNumber: row.operatorNumber,
    modelNumberId: row.modelNumberId,
    quantity: row.quantity,
    manufacturingDate: row.manufacturingDate,
    orderId: row.orderId,
    rmCode: row.rmCode
  };
}

export async function getFpCodesByOrder(input: GetFpCodesByOrderInput) {
  const result = await pool.query(
    `
      SELECT id,
        serial,
        status,
        operator_number AS "operatorNumber",
        model_number_id AS "modelNumberId",
        quantity,
        TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
        order_id AS "orderId",
        rm_code AS "rmCode"
      FROM generated_operator_codes
      WHERE section_key = $1
        AND code_type = $2
        AND order_id = $3
      ORDER BY serial ASC
    `,
    [input.sectionKey, input.codeType ?? "fp", input.orderId]
  );

  return result.rows.map(mapCodeRow);
}

async function generateDerivedCodes(input: GenerateDerivedCodesInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingTargetResult = await client.query(
      `
        SELECT id,
          batch_id AS "batchId",
          serial,
          status,
          operator_number AS "operatorNumber",
          model_number_id AS "modelNumberId",
          quantity,
          TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
          order_id AS "orderId",
          rm_code AS "rmCode"
        FROM generated_operator_codes
        WHERE section_key = $1
          AND code_type = $2
          AND order_id = $3
        ORDER BY serial ASC
      `,
      [input.sectionKey, input.targetCodeType, input.orderId]
    );

    if (existingTargetResult.rows.length > 0 && !input.sourceStatus) {
      await client.query("COMMIT");
      return { existing: true, codes: existingTargetResult.rows.map(mapCodeRow) };
    }

    const sourceResult = await client.query(
      `
        SELECT serial,
          model_number_id AS "modelNumberId",
          quantity,
          TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
          order_id AS "orderId"
        FROM generated_operator_codes
        WHERE section_key = $1
          AND code_type = $2
          AND order_id = $3
          AND ($4::text IS NULL OR status = $4)
        ORDER BY serial ASC
      `,
      [input.sectionKey, input.sourceCodeType, input.orderId, input.sourceStatus ?? null]
    );

    if (sourceResult.rows.length === 0) {
      throw new Error(`${input.sourceCodeType.toUpperCase()} codes not found for this Order ID`);
    }

    const firstSourceCode = sourceResult.rows[0];
    const batchResult = existingTargetResult.rows[0]
      ? { rows: [{ id: existingTargetResult.rows[0].batchId }] }
      : await client.query(
      `
        INSERT INTO generated_code_batches (section_key, code_type, order_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (section_key, code_type, order_id) DO NOTHING
        RETURNING id
      `,
      [input.sectionKey, input.targetCodeType, input.orderId]
    );

    if (!batchResult.rows[0]) {
      const codes = await getFpCodesByOrder({
        sectionKey: input.sectionKey,
        orderId: input.orderId,
        codeType: input.targetCodeType
      });
      await client.query("COMMIT");
      return { existing: true, codes };
    }

    const batchId = batchResult.rows[0].id;
    const existingSerials = new Set(
      existingTargetResult.rows.map((code) => String(code.serial))
    );
    const codes = existingTargetResult.rows.map(mapCodeRow);

    for (const sourceCode of sourceResult.rows) {
      if (existingSerials.has(String(sourceCode.serial))) {
        continue;
      }

      const result = await client.query(
        `
          INSERT INTO generated_operator_codes (
            batch_id,
            serial,
            section_key,
            code_type,
            operator_number,
            model_number_id,
            quantity,
            manufacturing_date,
            order_id,
            rm_code,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL)
          RETURNING id,
            serial,
            status,
            operator_number AS "operatorNumber",
            model_number_id AS "modelNumberId",
            quantity,
            TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
            order_id AS "orderId",
            rm_code AS "rmCode"
        `,
        [
          batchId,
          sourceCode.serial,
          input.sectionKey,
          input.targetCodeType,
          input.operatorNumber,
          firstSourceCode.modelNumberId,
          firstSourceCode.quantity,
          firstSourceCode.manufacturingDate,
          input.orderId,
          input.rmCode
        ]
      );

      codes.push(mapCodeRow(result.rows[0]));
    }

    await client.query("COMMIT");
    return { existing: false, codes };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function generateHpbCodes(input: GenerateHpbCodesInput) {
  return generateDerivedCodes({
    ...input,
    sourceCodeType: "fp",
    targetCodeType: "hpb"
  });
}

export async function generateBrazerCodes(input: GenerateHpbCodesInput) {
  return generateDerivedCodes({
    ...input,
    sourceCodeType: "hpb",
    targetCodeType: "br"
  });
}

export async function generateLeakTestingCodes(input: GenerateHpbCodesInput) {
  return generateDerivedCodes({
    ...input,
    sourceCodeType: "br",
    targetCodeType: "lt",
    sourceStatus: "approved"
  });
}

export async function generateFpCodes(input: GenerateFpCodesInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `
        SELECT id,
          serial,
          status,
          operator_number AS "operatorNumber",
          model_number_id AS "modelNumberId",
          quantity,
          TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
          order_id AS "orderId",
          rm_code AS "rmCode"
        FROM generated_operator_codes
        WHERE section_key = $1
          AND code_type = 'fp'
          AND order_id = $2
        ORDER BY serial ASC
      `,
      [input.sectionKey, input.orderId]
    );

    if (existingResult.rows.length > 0) {
      await client.query("COMMIT");
      return {
        existing: true,
        codes: existingResult.rows.map(mapCodeRow)
      };
    }

    const batchResult = await client.query(
      `
        INSERT INTO generated_code_batches (section_key, code_type, order_id)
        VALUES ($1, 'fp', $2)
        ON CONFLICT (section_key, code_type, order_id) DO NOTHING
        RETURNING id
      `,
      [input.sectionKey, input.orderId]
    );

    if (!batchResult.rows[0]) {
      const codes = await getFpCodesByOrder({
        sectionKey: input.sectionKey,
        orderId: input.orderId
      });
      await client.query("COMMIT");
      return { existing: true, codes };
    }

    const batchId = batchResult.rows[0].id;
    const codes = [];

    for (let index = 0; index < input.quantity; index += 1) {
      const result = await client.query(
        `
          INSERT INTO generated_operator_codes (
            batch_id,
            section_key,
            code_type,
            operator_number,
            model_number_id,
            quantity,
            manufacturing_date,
            order_id,
            rm_code,
            status
          )
          VALUES ($1, $2, 'fp', $3, NULLIF($4, '')::uuid, $5, $6, $7, $8, NULL)
          RETURNING id,
            serial,
            status,
            operator_number AS "operatorNumber",
            model_number_id AS "modelNumberId",
            quantity,
            TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
            order_id AS "orderId",
            rm_code AS "rmCode"
        `,
        [
          batchId,
          input.sectionKey,
          input.operatorNumber,
          input.modelNumberId ?? "",
          input.quantity,
          input.manufacturingDate,
          input.orderId,
          input.rmCode
        ]
      );

      codes.push(mapCodeRow(result.rows[0]));
    }

    await client.query("COMMIT");
    return { existing: false, codes };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateCodeStatuses(
  codes: Array<{ id: string; status: "approved" | "rejected" | null }>
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedCodes = [];

    for (const code of codes) {
      const result = await client.query(
        `
          UPDATE generated_operator_codes
          SET status = $1,
              updated_at = NOW()
          WHERE id = $2
          RETURNING id, serial, status
        `,
        [code.status, code.id]
      );

      if (result.rows[0]) {
        updatedCodes.push(result.rows[0]);
      }
    }

    await client.query("COMMIT");
    return updatedCodes;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
