import { pool } from "../config/db.js";
import {
  condensingSectionKey,
  condensingSectionLabel,
  condensingSerialPrefix
} from "../condensing/condensing.constants.js";

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

type GenerateInspectionSerialsInput = {
  sectionKey: string;
  orderId: string;
  operatorNumber: string;
  inspectionNote: string;
};

const sectionPrefixMap: Record<string, string> = {
  "heat-exchanger": "H",
  [condensingSectionKey]: condensingSerialPrefix,
  "evaporator-unit": "E"
};

const sectionLabelMap: Record<string, string> = {
  "heat-exchanger": "Heat Exchanger",
  [condensingSectionKey]: condensingSectionLabel,
  "evaporator-unit": "Evaporator Unit"
};

function mapCodeRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    serial: row.serial,
    status: row.status,
    statusOperatorNumber: row.statusOperatorNumber,
    operatorNumber: row.operatorNumber,
    modelNumberId: row.modelNumberId,
    quantity: row.quantity,
    manufacturingDate: row.manufacturingDate,
    orderId: row.orderId,
    rmCode: row.rmCode
  };
}

function buildSerialNumber(sectionKey: string, manufacturingDate: string, sourceSerial: string | number) {
  const [year, month] = manufacturingDate.split("-");
  const prefix = sectionPrefixMap[sectionKey] ?? sectionKey.slice(0, 1).toUpperCase();
  return `${prefix}${month}${year.slice(-2)}-${String(sourceSerial).padStart(5, "0")}`;
}

function buildOperatorCodeValue(operatorNumber: string, manufacturingDate: string, serial: string | number, codeType: string) {
  const [year, month] = manufacturingDate.split("-");
  const prefix =
    codeType === "br" || codeType === "lt"
      ? operatorNumber.split("-")[0]
      : operatorNumber.replace("-", "");

  return `${prefix}-${month}-${year}-${serial}`;
}

export async function getFpCodesByOrder(input: GetFpCodesByOrderInput) {
  const result = await pool.query(
    `
      SELECT id,
        serial,
        status,
        status_operator_number AS "statusOperatorNumber",
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
          status_operator_number AS "statusOperatorNumber",
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
            status_operator_number AS "statusOperatorNumber",
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
          status_operator_number AS "statusOperatorNumber",
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
    const nextSerialResult = await client.query(
      `
        SELECT COALESCE(MAX(serial), 0) + 1 AS "nextSerial"
        FROM generated_operator_codes
        WHERE section_key = $1
          AND code_type = 'fp'
      `,
      [input.sectionKey]
    );
    const firstSerial = Number(nextSerialResult.rows[0].nextSerial);

    for (let index = 0; index < input.quantity; index += 1) {
      const serial = firstSerial + index;
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
          VALUES ($1, $2, $3, 'fp', $4, NULLIF($5, '')::uuid, $6, $7, $8, $9, NULL)
          RETURNING id,
            serial,
            status,
            status_operator_number AS "statusOperatorNumber",
            operator_number AS "operatorNumber",
            model_number_id AS "modelNumberId",
            quantity,
            TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
            order_id AS "orderId",
            rm_code AS "rmCode"
        `,
        [
          batchId,
          serial,
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
  codes: Array<{ id: string; status: "approved" | "rejected" | null }>,
  operatorNumber?: string
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
              status_operator_number = CASE
                WHEN $1::text IS NULL THEN NULL
                WHEN status IS DISTINCT FROM $1::text THEN COALESCE($3, status_operator_number, operator_number)
                ELSE COALESCE(status_operator_number, $3, operator_number)
              END,
              updated_at = NOW()
          WHERE id = $2
          RETURNING id, serial, status, status_operator_number AS "statusOperatorNumber"
        `,
        [code.status, code.id, operatorNumber ?? null]
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

export async function generateInspectionSerials(input: GenerateInspectionSerialsInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ltResult = await client.query(
      `
        SELECT id,
          serial,
          TO_CHAR(manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate"
        FROM generated_operator_codes
        WHERE section_key = $1
          AND code_type = 'lt'
          AND order_id = $2
          AND status = 'approved'
        ORDER BY serial ASC
      `,
      [input.sectionKey, input.orderId]
    );

    if (ltResult.rows.length === 0) {
      throw new Error("Approved LT codes not found for this Order ID");
    }

    const serials = [];

    for (const ltCode of ltResult.rows) {
      const existingResult = await client.query(
        `
          SELECT id,
            serial_number AS "serialNumber",
            source_serial AS "sourceSerial",
            inspection_note AS "inspectionNote",
            false AS created
          FROM generated_serial_numbers
          WHERE section_key = $1
            AND order_id = $2
            AND lt_code_id = $3
        `,
        [input.sectionKey, input.orderId, ltCode.id]
      );

      if (existingResult.rows[0]) {
        const expectedSerialNumber = buildSerialNumber(
          input.sectionKey,
          ltCode.manufacturingDate,
          ltCode.serial
        );

        if (existingResult.rows[0].serialNumber !== expectedSerialNumber) {
          const correctedResult = await client.query(
            `
              UPDATE generated_serial_numbers
              SET serial_number = $1
              WHERE id = $2
              RETURNING id,
                serial_number AS "serialNumber",
                source_serial AS "sourceSerial",
                inspection_note AS "inspectionNote",
                false AS created
            `,
            [expectedSerialNumber, existingResult.rows[0].id]
          );
          serials.push(correctedResult.rows[0]);
        } else {
          serials.push(existingResult.rows[0]);
        }
        continue;
      }

      const insertedResult = await client.query(
        `
          INSERT INTO generated_serial_numbers (
            section_key,
            order_id,
            lt_code_id,
            source_serial,
            inspector_operator_number,
            inspection_note
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, serial_index AS "serialIndex"
        `,
        [
          input.sectionKey,
          input.orderId,
          ltCode.id,
          ltCode.serial,
          input.operatorNumber,
          input.inspectionNote
        ]
      );

      const serialNumber = buildSerialNumber(
        input.sectionKey,
        ltCode.manufacturingDate,
        ltCode.serial
      );

      const updatedResult = await client.query(
        `
          UPDATE generated_serial_numbers
          SET serial_number = $1
          WHERE id = $2
          RETURNING id,
            serial_number AS "serialNumber",
            source_serial AS "sourceSerial",
            inspection_note AS "inspectionNote",
            true AS created
        `,
        [serialNumber, insertedResult.rows[0].id]
      );

      serials.push(updatedResult.rows[0]);
    }

    await client.query("COMMIT");
    return serials;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getBarcodeDetails(serialNumber: string) {
  const serialResult = await pool.query(
    `
      SELECT gs.serial_number AS "serialNumber",
        gs.section_key AS "sectionKey",
        gs.order_id AS "orderId",
        gs.source_serial AS "sourceSerial",
        gs.inspection_note AS "inspectionNote",
        TO_CHAR(lt.manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
        lt.model_number_id AS "modelNumberId",
        model.model_number AS "modelNumber"
      FROM generated_serial_numbers gs
      JOIN generated_operator_codes lt ON lt.id = gs.lt_code_id
      LEFT JOIN admin_model_numbers model ON model.id = lt.model_number_id
      WHERE gs.serial_number = $1
      LIMIT 1
    `,
    [serialNumber]
  );

  if (!serialResult.rows[0]) {
    return null;
  }

  const serial = serialResult.rows[0];
  const codesResult = await pool.query(
    `
      SELECT code_type AS "codeType",
        codes.operator_number AS "operatorNumber",
        codes.status_operator_number AS "statusOperatorNumber",
        codes.serial,
        codes.status,
        codes.rm_code AS "rmCode",
        TO_CHAR(codes.manufacturing_date, 'YYYY-MM-DD') AS "manufacturingDate",
        creator.username AS "creatorUsername",
        status_user.username AS "statusUsername"
      FROM generated_operator_codes codes
      LEFT JOIN admin_users creator ON creator.operator_number = codes.operator_number
      LEFT JOIN admin_users status_user ON status_user.operator_number = codes.status_operator_number
      WHERE section_key = $1
        AND order_id = $2
        AND serial = $3
      ORDER BY CASE code_type
        WHEN 'fp' THEN 1
        WHEN 'hpb' THEN 2
        WHEN 'br' THEN 3
        WHEN 'lt' THEN 4
        ELSE 9
      END
    `,
    [serial.sectionKey, serial.orderId, serial.sourceSerial]
  );

  const codes = codesResult.rows.map((code) => ({
    ...code,
    code: buildOperatorCodeValue(
      code.operatorNumber,
      code.manufacturingDate,
      code.serial,
      code.codeType
    )
  }));

  return {
    serialNumber: serial.serialNumber,
    moduleName: sectionLabelMap[serial.sectionKey] ?? serial.sectionKey,
    orderId: serial.orderId,
    modelNumber: serial.modelNumber,
    inspectionNote: serial.inspectionNote,
    aluminiumDetails: codes.find((code) => code.codeType === "fp")?.rmCode ?? "",
    copperTubeDetails: codes.find((code) => code.codeType === "hpb")?.rmCode ?? "",
    operatorFlow: codes.map((code) => ({
      key: code.codeType,
      label: code.codeType.toUpperCase(),
      code: code.code,
      status: code.status ?? "untouched",
      username:
        code.statusUsername ??
        code.statusOperatorNumber ??
        code.creatorUsername ??
        code.operatorNumber
    }))
  };
}
