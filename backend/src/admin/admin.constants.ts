export const operatorTypeMap = {
  fp: {
    label: "FP Operator",
    values: ["FP-1", "FP-2", "FP-3", "FP-4", "FP-5", "FP-6", "FP-7", "FP-8"]
  },
  hpb: {
    label: "HPB Operator",
    values: ["HPB-1", "HPB-2", "HPB-3", "HPB-4", "HPB-5", "HPB-6", "HPB-7", "HPB-8"]
  },
  lc: {
    label: "Lacing Operator",
    values: ["LC-1", "LC-2", "LC-3", "LC-4", "LC-5", "LC-6", "LC-7", "LC-8"]
  },
  exp: {
    label: "Expansion Operator",
    values: ["EXP-1", "EXP-2", "EXP-3", "EXP-4", "EXP-5", "EXP-6", "EXP-7", "EXP-8"]
  },
  lt: {
    label: "Leak Testing Operator",
    values: ["LT-1", "LT-2", "LT-3", "LT-4", "LT-5", "LT-6", "LT-7", "LT-8"]
  },
  pk: {
    label: "Packer",
    values: ["PK-1", "PK-2", "PK-3", "PK-4", "PK-5", "PK-6", "PK-7", "PK-8"]
  },
  inspec: {
    label: "Inspector",
    values: [
      "INSPEC-1",
      "INSPEC-2",
      "INSPEC-3",
      "INSPEC-4",
      "INSPEC-5",
      "INSPEC-6",
      "INSPEC-7",
      "INSPEC-8"
    ]
  },
  br: {
    label: "Brazer",
    values: ["BR-1", "BR-2", "BR-3", "BR-4", "BR-5", "BR-6", "BR-7", "BR-8"]
  }
} as const;

export type OperatorTypeKey = keyof typeof operatorTypeMap;
