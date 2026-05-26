import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import {
  Check,
  ChevronDown,
  Circle,
  Flame,
  LogOut,
  Snowflake,
  Waves,
  X
} from "lucide-react";
import {
  fetchFpOperatorCodesByOrder,
  fetchAdminBootstrap,
  generateBrazerOperatorCodes,
  generateFpOperatorCodes,
  generateHpbOperatorCodes,
  generateInspectionSerials,
  generateLeakTestingOperatorCodes,
  updateOperatorCodeStatuses
} from "../admin/adminApi";

const sections = [
  { id: "heat-exchanger", label: "Heat Exchanger", icon: Flame },
  { id: "condensing-unit", label: "Condensing Unit", icon: Waves },
  { id: "evaporator-unit", label: "Evaporator Unit", icon: Snowflake }
];

const fpCodeFormat = {
  separator: "-",
  dateParts: ["month", "year"]
};

function createInitialState() {
  return {
    modelNumberId: "",
    quantity: "",
    dateOfManufacturing: "",
    orderId: "",
    aluminiumRmCode: "",
    fpCodes: [],
    copperTubeRmCode: "",
    hpbCodes: [],
    hpbOperatorCode: "",
    productCount: "",
    lacingOperatorCode: "",
    expansionOperatorCode: "",
    brazerName: "",
    brazerCodes: [],
    leakTestingOperatorCode: "",
    leakTestingCodes: [],
    inspectionSerials: [],
    packingType: "",
    packerName: "",
    inspectionDoneBy: ""
  };
}

const initialSectionState = {
  "heat-exchanger": createInitialState(),
  "condensing-unit": createInitialState(),
  "evaporator-unit": createInitialState()
};

function LogoMark() {
  return (
    <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white" aria-hidden="true">
      <div className="relative grid h-[42px] w-[42px] place-items-center rounded-full border-2 border-[#e1ebfa] text-[#1994d5]">
        <span className="absolute top-[7px] h-4 w-4 rounded-full border-t-[3px] border-t-[#1994d5] border-r-[3px] border-r-transparent border-b-[3px] border-b-transparent border-l-[3px] border-l-transparent" />
        <span className="mt-3 text-[10px] font-extrabold">PR</span>
      </div>
    </div>
  );
}

function Field({ label, extra, children }) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-[#0f255b]">{label}</span>
        {extra}
      </div>
      {children}
    </label>
  );
}

function ConfirmGenerateModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[404px] overflow-hidden rounded-[12px] bg-white shadow-[0_24px_60px_rgba(17,39,89,0.22)]">
        <div className="flex justify-end px-4 pt-4">
          <button type="button" onClick={onClose} className="text-[#727d90]">
            <X size={22} />
          </button>
        </div>
        <div className="border-b border-[#e7ecf4] px-6 pb-6 text-center">
          <h3 className="text-[18px] font-bold text-[#111111]">Are you sure you want to approve?</h3>
        </div>
        <div className="flex justify-center gap-10 px-6 py-5">
          <button
            type="button"
            onClick={onConfirm}
            className="min-w-[88px] rounded-[7px] bg-[#0fd04d] px-5 py-2 text-[16px] font-bold text-white"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[88px] rounded-[7px] bg-[#ff1353] px-5 py-2 text-[16px] font-bold text-white"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

function FpCodesModal({ title, codes, lockResolvedStatuses = false, onClose, onSave }) {
  const [localCodes, setLocalCodes] = useState(codes);
  const lockedCodeIds = useMemo(
    () =>
      new Set(
        lockResolvedStatuses
          ? codes.filter((code) => code.status).map((code) => code.id)
          : []
      ),
    [codes, lockResolvedStatuses]
  );

  function setStatus(index, status) {
    if (lockedCodeIds.has(localCodes[index]?.id)) {
      return;
    }

    setLocalCodes((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, status: item.status === status ? null : status }
          : item
      )
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[500px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_60px_rgba(17,39,89,0.22)]">
        <div className="flex items-center justify-between px-6 py-5">
          <h3 className="text-[17px] font-extrabold text-[#172d63]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#97a1b3]">
            <X size={24} />
          </button>
        </div>

        <div className="border-t border-[#e7ecf4] px-6 py-6">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f9fd] text-left text-[14px] font-bold text-[#172d63]">
                <th className="px-4 py-3">S.no</th>
                <th className="px-4 py-3">Codes</th>
                <th className="px-4 py-3 text-center" colSpan={2}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {localCodes.map((code, index) => {
                const isLocked = lockedCodeIds.has(code.id);

                return (
                  <tr key={code.value} className="border-b border-[#edf2f8]">
                    <td className="px-4 py-4 text-[15px] text-[#24385b]">{index + 1}</td>
                    <td className="px-4 py-4 text-[15px] text-[#24385b]">{code.value}</td>
                    {isLocked ? (
                      <td className="px-4 py-4 text-center" colSpan={2}>
                        <span
                          className={`inline-flex items-center gap-2 text-[13px] font-bold ${
                            code.status === "approved" ? "text-[#0fc65b]" : "text-[#ff1654]"
                          }`}
                        >
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-full text-white ${
                              code.status === "approved" ? "bg-[#0fc65b]" : "bg-[#ff1654]"
                            }`}
                          >
                            {code.status === "approved" ? <Check size={14} /> : <X size={14} />}
                          </span>
                          {code.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-4 text-center">
                          <button type="button" onClick={() => setStatus(index, "approved")}>
                            {code.status === "approved" ? (
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0fc65b] text-white">
                                <Check size={14} />
                              </span>
                            ) : (
                              <Circle size={24} className="text-[#b7c2d4]" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button type="button" onClick={() => setStatus(index, "rejected")}>
                            {code.status === "rejected" ? (
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ff1654] text-white">
                                <X size={14} />
                              </span>
                            ) : (
                              <Circle size={24} className="text-[#b7c2d4]" />
                            )}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => onSave(localCodes)}
              className="rounded-[8px] bg-[#162d61] px-8 py-3 text-[16px] font-bold text-white"
            >
              Save Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDateCodeParts(dateValue) {
  if (!dateValue) {
    return {};
  }

  const [year, month, day] = dateValue.split("-");

  return { day, month, year };
}

function getOperatorCodePrefix(operatorNumber, codeType) {
  if (codeType === "br" || codeType === "lt") {
    return operatorNumber.split("-")[0] ?? operatorNumber;
  }

  return operatorNumber.replace("-", "");
}

function buildOperatorCodeValue(operatorNumber, dateValue, serial, codeType = "fp") {
  const operatorPrefix = getOperatorCodePrefix(operatorNumber, codeType);
  const dateParts = getDateCodeParts(dateValue);
  const formattedDate = fpCodeFormat.dateParts
    .map((part) => dateParts[part])
    .filter(Boolean)
    .join(fpCodeFormat.separator);

  return [operatorPrefix, formattedDate, serial]
    .filter((part) => part !== "")
    .join(fpCodeFormat.separator);
}

function BarcodeSticker({ serialNumber }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (!barcodeRef.current || !serialNumber) {
      return;
    }

    JsBarcode(barcodeRef.current, serialNumber, {
      format: "CODE128",
      displayValue: false,
      margin: 0,
      width: 1,
      height: 34
    });
  }, [serialNumber]);

  return (
    <div className="grid h-[15mm] w-[60mm] place-items-center bg-white text-black">
      <div className="grid justify-items-center gap-[1mm]">
        <svg ref={barcodeRef} className="h-[9mm] w-[35mm]" />
        <div className="font-mono text-[7px] font-bold leading-none">{serialNumber}</div>
      </div>
    </div>
  );
}

export default function ProductionDashboardPage({ session, onLogout }) {
  const [activeSection, setActiveSection] = useState("heat-exchanger");
  const [modelNumbers, setModelNumbers] = useState([]);
  const [sectionState, setSectionState] = useState(initialSectionState);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(null);
  const [orderLookupLoading, setOrderLookupLoading] = useState(false);

  const currentSection = useMemo(
    () => sections.find((section) => section.id === activeSection) ?? sections[0],
    [activeSection]
  );

  const currentValues = sectionState[activeSection];
  const isHpbOperator =
    session?.user?.operatorType === "hpb" ||
    session?.user?.operatorNumber?.toUpperCase().startsWith("HPB");
  const isBrazerOperator =
    session?.user?.operatorType === "br" ||
    session?.user?.operatorNumber?.toUpperCase().startsWith("BR");
  const isLeakTestingOperator =
    session?.user?.operatorType === "lt" ||
    session?.user?.operatorNumber?.toUpperCase().startsWith("LT");
  const isInspectorOperator =
    session?.user?.operatorType === "inspec" ||
    session?.user?.operatorNumber?.toUpperCase().startsWith("INSPEC");
  const isDerivedOperator = isHpbOperator || isBrazerOperator || isLeakTestingOperator || isInspectorOperator;
  const fpPreview = currentValues.fpCodes[0]?.value ?? "";
  const extraCodesCount = Math.max(currentValues.fpCodes.length - 1, 0);
  const hpbPreview = currentValues.hpbCodes[0]?.value ?? "";
  const hpbExtraCodesCount = Math.max(currentValues.hpbCodes.length - 1, 0);
  const brazerPreview = currentValues.brazerCodes[0]?.value ?? "";
  const brazerExtraCodesCount = Math.max(currentValues.brazerCodes.length - 1, 0);
  const leakTestingPreview = currentValues.leakTestingCodes[0]?.value ?? "";
  const leakTestingExtraCodesCount = Math.max(currentValues.leakTestingCodes.length - 1, 0);
  const serialRange =
    currentValues.inspectionSerials.length > 0
      ? `${currentValues.inspectionSerials[0].serialNumber} to ${
          currentValues.inspectionSerials[currentValues.inspectionSerials.length - 1].serialNumber
        }`
      : "";
  const missingInspectionSerials = currentValues.leakTestingCodes.some(
    (code) =>
      code.status === "approved" &&
      !currentValues.inspectionSerials.some((serial) => Number(serial.sourceSerial) === code.serial)
  );
  const approvedBrazerCodesCount = currentValues.brazerCodes.filter(
    (code) => code.status === "approved"
  ).length;
  const hasMissingLeakTestingCodes = currentValues.brazerCodes.some(
    (code) =>
      code.status === "approved" &&
      !currentValues.leakTestingCodes.some(
        (leakTestingCode) => leakTestingCode.serial === code.serial
      )
  );
  const hasRequiredInputParameters =
    currentValues.modelNumberId &&
    Number(currentValues.quantity) > 0 &&
    currentValues.dateOfManufacturing &&
    currentValues.orderId.trim();
  const activeStageValue = isInspectorOperator
    ? currentValues.inspectionDoneBy.trim()
    : isLeakTestingOperator
      ? approvedBrazerCodesCount > 0
      : isBrazerOperator
        ? currentValues.hpbCodes.length > 0
        : isHpbOperator
          ? currentValues.copperTubeRmCode.trim()
          : currentValues.aluminiumRmCode.trim();
  const activeStageCodes = isInspectorOperator
    ? currentValues.inspectionSerials
    : isLeakTestingOperator
      ? currentValues.leakTestingCodes
      : isBrazerOperator
        ? currentValues.brazerCodes
        : isHpbOperator
          ? currentValues.hpbCodes
          : currentValues.fpCodes;
  const hasRequiredPreviousStage = isInspectorOperator
    ? currentValues.leakTestingCodes.some((code) => code.status === "approved")
    : isLeakTestingOperator
      ? approvedBrazerCodesCount > 0
      : isBrazerOperator
        ? currentValues.hpbCodes.length > 0
        : isHpbOperator
          ? currentValues.fpCodes.length > 0
          : true;
  const canGenerateCode =
    activeSection === "heat-exchanger" &&
    hasRequiredInputParameters &&
    activeStageValue &&
    session?.user?.operatorNumber &&
    (isInspectorOperator
      ? missingInspectionSerials || activeStageCodes.length === 0
      : isLeakTestingOperator
        ? hasMissingLeakTestingCodes
        : activeStageCodes.length === 0) &&
    hasRequiredPreviousStage &&
    !orderLookupLoading;

  useEffect(() => {
    async function loadModelNumbers() {
      try {
        const data = await fetchAdminBootstrap();
        setModelNumbers(data.modelNumbers ?? []);
      } catch (error) {
        console.error("Failed to load model numbers", error);
      }
    }

    loadModelNumbers();
  }, []);

  useEffect(() => {
    if (activeSection !== "heat-exchanger" || !currentValues.orderId.trim()) {
      return;
    }

    let ignore = false;

    async function loadExistingOrderCodes() {
      try {
        setOrderLookupLoading(true);
        const response = await fetchFpOperatorCodesByOrder({
          sectionKey: activeSection,
          orderId: currentValues.orderId.trim()
        });

        if (ignore || !response.exists) {
          return;
        }

        const firstCode = response.codes[0];

        let hpbCodes = [];
        let hpbRmCode = "";
        if (isDerivedOperator) {
          const hpbResponse = await fetchFpOperatorCodesByOrder({
            sectionKey: activeSection,
            orderId: currentValues.orderId.trim(),
            codeType: "hpb"
          });
          hpbRmCode = hpbResponse.codes?.[0]?.rmCode ?? "";

          hpbCodes = hpbResponse.exists
            ? hpbResponse.codes.map((code) => ({
                id: code.id,
                serial: Number(code.serial),
                value: buildOperatorCodeValue(
                  code.operatorNumber,
                  code.manufacturingDate,
                  Number(code.serial),
                  "hpb"
                ),
                status: code.status,
                rmCode: code.rmCode
              }))
            : [];
        }

        let brazerCodes = [];
        if (isBrazerOperator || isLeakTestingOperator || isInspectorOperator) {
          const brazerResponse = await fetchFpOperatorCodesByOrder({
            sectionKey: activeSection,
            orderId: currentValues.orderId.trim(),
            codeType: "br"
          });

          brazerCodes = brazerResponse.exists
            ? brazerResponse.codes.map((code) => ({
                id: code.id,
                serial: Number(code.serial),
                value: buildOperatorCodeValue(
                  code.operatorNumber,
                  code.manufacturingDate,
                  Number(code.serial),
                  "br"
                ),
                status: code.status,
                rmCode: code.rmCode
              }))
            : [];
        }

        let leakTestingCodes = [];
        if (isLeakTestingOperator || isInspectorOperator) {
          const leakTestingResponse = await fetchFpOperatorCodesByOrder({
            sectionKey: activeSection,
            orderId: currentValues.orderId.trim(),
            codeType: "lt"
          });

          leakTestingCodes = leakTestingResponse.exists
            ? leakTestingResponse.codes.map((code) => ({
                id: code.id,
                serial: Number(code.serial),
                value: buildOperatorCodeValue(
                  code.operatorNumber,
                  code.manufacturingDate,
                  Number(code.serial),
                  "lt"
                ),
                status: code.status,
                rmCode: code.rmCode
              }))
            : [];
        }

        setSectionState((current) => ({
          ...current,
          [activeSection]: {
            ...current[activeSection],
            modelNumberId: firstCode.modelNumberId ?? "",
            quantity: String(firstCode.quantity ?? response.codes.length),
            dateOfManufacturing: firstCode.manufacturingDate ?? "",
            orderId: firstCode.orderId ?? current[activeSection].orderId,
            aluminiumRmCode: firstCode.rmCode ?? "",
            copperTubeRmCode: hpbRmCode,
            brazerName: brazerCodes[0]?.rmCode ?? "",
            hpbCodes,
            brazerCodes,
            leakTestingCodes,
            fpCodes: response.codes.map((code) => ({
              id: code.id,
              serial: Number(code.serial),
              value: buildOperatorCodeValue(
                code.operatorNumber,
                code.manufacturingDate,
                Number(code.serial),
                "fp"
              ),
              status: code.status,
              rmCode: code.rmCode
            }))
          }
        }));
      } catch (error) {
        console.error("Failed to load existing order codes", error);
      } finally {
        if (!ignore) {
          setOrderLookupLoading(false);
        }
      }
    }

    const lookupTimer = window.setTimeout(loadExistingOrderCodes, 350);

    return () => {
      ignore = true;
      window.clearTimeout(lookupTimer);
    };
  }, [
    activeSection,
    currentValues.orderId,
    isDerivedOperator,
    isBrazerOperator,
    isLeakTestingOperator,
    isInspectorOperator
  ]);

  function updateField(field, value) {
    setSectionState((current) => ({
      ...current,
      [activeSection]: {
        ...current[activeSection],
        [field]: value,
        ...(field === "orderId" && current[activeSection].orderId !== value
          ? { fpCodes: [], hpbCodes: [], brazerCodes: [], leakTestingCodes: [], inspectionSerials: [] }
          : {})
      }
    }));
  }

  async function handleGenerateConfirm() {
    if (isInspectorOperator) {
      const response = await generateInspectionSerials({
        sectionKey: activeSection,
        orderId: currentValues.orderId,
        operatorNumber: session.user.operatorNumber,
        inspectionNote: currentValues.inspectionDoneBy
      });

      setSectionState((current) => ({
        ...current,
        [activeSection]: {
          ...current[activeSection],
          inspectionSerials: response.serials.map((serial) => ({
            ...serial,
            sourceSerial: Number(serial.sourceSerial)
          }))
        }
      }));
      setShowGenerateConfirm(false);
      return;
    }

    const response = isLeakTestingOperator
      ? await generateLeakTestingOperatorCodes({
          sectionKey: activeSection,
          operatorNumber: session.user.operatorNumber,
          orderId: currentValues.orderId,
          rmCode: session.user.username || session.user.operatorNumber
        })
      : isBrazerOperator
      ? await generateBrazerOperatorCodes({
          sectionKey: activeSection,
          operatorNumber: session.user.operatorNumber,
          orderId: currentValues.orderId,
          rmCode: currentValues.brazerName || session.user.username || session.user.operatorNumber
        })
      : isHpbOperator
        ? await generateHpbOperatorCodes({
          sectionKey: activeSection,
          operatorNumber: session.user.operatorNumber,
          orderId: currentValues.orderId,
          rmCode: currentValues.copperTubeRmCode
        })
        : await generateFpOperatorCodes({
          sectionKey: activeSection,
          operatorNumber: session.user.operatorNumber,
          modelNumberId: currentValues.modelNumberId,
          quantity: Number(currentValues.quantity),
          manufacturingDate: currentValues.dateOfManufacturing,
          orderId: currentValues.orderId,
          rmCode: currentValues.aluminiumRmCode
        });

    const nextCodes = response.codes.map((code) => ({
      id: code.id,
      serial: Number(code.serial),
      value: buildOperatorCodeValue(
        code.operatorNumber,
        code.manufacturingDate,
        Number(code.serial),
        isLeakTestingOperator ? "lt" : isBrazerOperator ? "br" : isHpbOperator ? "hpb" : "fp"
      ),
      status: code.status,
      rmCode: code.rmCode
    }));

    setSectionState((current) => ({
      ...current,
      [activeSection]: {
        ...current[activeSection],
        ...(isLeakTestingOperator
          ? { leakTestingCodes: nextCodes }
          : isBrazerOperator
            ? { brazerCodes: nextCodes }
            : isHpbOperator
              ? { hpbCodes: nextCodes }
              : { fpCodes: nextCodes })
      }
    }));
    setShowGenerateConfirm(false);
  }

  async function handleSaveStatuses(nextCodes) {
    const response = await updateOperatorCodeStatuses({
      codes: nextCodes.map((code) => ({
        id: code.id,
        status: code.status
      }))
    });

    const statusesById = new Map(
      response.codes.map((code) => [code.id, code.status])
    );

    setSectionState((current) => ({
      ...current,
      [activeSection]: {
        ...current[activeSection],
        ...(showViewAllModal === "hpb"
          ? {
              hpbCodes: nextCodes.map((code) => ({
                ...code,
                status: statusesById.has(code.id) ? statusesById.get(code.id) : code.status
              }))
            }
          : showViewAllModal === "br"
            ? {
                brazerCodes: nextCodes.map((code) => ({
                  ...code,
                  status: statusesById.has(code.id) ? statusesById.get(code.id) : code.status
                }))
              }
          : showViewAllModal === "lt" ||
              showViewAllModal === "lt-approved" ||
              showViewAllModal === "lt-rejected"
            ? {
                leakTestingCodes: current[activeSection].leakTestingCodes.map((code) => {
                  const updatedCode = nextCodes.find((nextCode) => nextCode.id === code.id);

                  return updatedCode
                    ? {
                        ...code,
                        status: statusesById.has(code.id)
                          ? statusesById.get(code.id)
                          : updatedCode.status
                      }
                    : code;
                })
              }
          : {
              fpCodes: nextCodes.map((code) => ({
                ...code,
                status: statusesById.has(code.id) ? statusesById.get(code.id) : code.status
              }))
            })
      }
    }));
    setShowViewAllModal(null);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f5f7fb] lg:grid-cols-[280px_minmax(0,1fr)]">
      <style>
        {`@media print {
          body * { visibility: hidden; }
          .barcode-print-area, .barcode-print-area * { visibility: visible; }
          .barcode-print-area { position: absolute; inset: 0 auto auto 0; display: grid !important; gap: 0; }
          @page { size: 60mm 15mm; margin: 0; }
        }`}
      </style>
      <aside className="flex flex-col bg-[#15285c] px-4 pt-6 pb-5 text-white">
        <div className="grid justify-items-center gap-[14px] pt-5 text-center">
          <LogoMark />
          <div>
            <h1 className="m-0 text-[17px] leading-[1.25] font-extrabold">
              Pragya Refrigeration
            </h1>
            <p className="mt-1 text-[15px] leading-[1.25] text-[#f2f5fb]">
              &amp; Electricals Pvt. Ltd.
            </p>
          </div>
        </div>

        <nav className="mt-7 grid gap-2 lg:mt-[42px]">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-[10px] px-5 py-3 text-left text-[15px] font-bold transition ${
                  isActive
                    ? "bg-[#ffd20c] text-[#0c1d4e]"
                    : "bg-transparent text-white"
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={17} strokeWidth={2.6} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="mb-3 rounded-xl bg-white/8 px-4 py-3 text-center text-[14px] font-semibold text-white/90">
            {session?.user?.username ?? "User"}
          </div>
          <div className="mb-3 rounded-xl bg-white/8 px-4 py-3 text-center text-[14px] font-semibold text-white/75">
            {session?.user?.operatorNumber ?? "Operator No."}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#8e2742] bg-[#2a1530] px-4 py-4 text-[16px] font-bold text-[#ff9db2]"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="px-4 pt-[18px] pb-6 sm:px-6">
        <section>
          <header>
            <h2 className="mt-[6px] mb-[18px] text-[29px] leading-[1.15] font-extrabold text-[#0e2b69]">
              {currentSection.label}
            </h2>
          </header>

          <div className="rounded-2xl bg-white px-[22px] pt-[22px] pb-7 shadow-[0_8px_28px_rgba(17,39,89,0.08)] lg:min-h-[calc(100vh-96px)]">
            <section>
              <h3 className="mb-[18px] text-[18px] leading-[1.2] font-extrabold text-[#0d255f]">
                Input Parameters
              </h3>
              <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                <Field label="Model Number">
                  <div className="relative">
                    <select
                      value={currentValues.modelNumberId}
                      onChange={(event) => updateField("modelNumberId", event.target.value)}
                      disabled={isDerivedOperator && !isInspectorOperator}
                      className="h-10 w-full appearance-none rounded-[8px] border border-[#d9dfec] bg-white pr-11 pl-[14px] text-[#173069] outline-none disabled:bg-[#f8f9fc] disabled:text-[#7b879a]"
                    >
                      <option value="">Select Model Number</option>
                      {modelNumbers.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.modelNumber}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[#233355]"
                    />
                  </div>
                </Field>

                <Field label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={currentValues.quantity}
                    onChange={(event) => updateField("quantity", event.target.value)}
                    disabled={isDerivedOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none disabled:bg-[#f8f9fc] disabled:text-[#7b879a]"
                  />
                </Field>

                <Field label="Date of Manufacturing">
                  <input
                    type="date"
                    value={currentValues.dateOfManufacturing}
                    onChange={(event) => updateField("dateOfManufacturing", event.target.value)}
                    disabled={isDerivedOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none disabled:bg-[#f8f9fc] disabled:text-[#7b879a]"
                  />
                </Field>

                <Field label="Order ID">
                  <input
                    type="text"
                    value={currentValues.orderId}
                    onChange={(event) => updateField("orderId", event.target.value)}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none"
                  />
                </Field>
              </div>
            </section>

            <section className="mt-[38px]">
              <h3 className="mb-[18px] text-[18px] leading-[1.2] font-extrabold text-[#0d255f]">
                Attributes
              </h3>
              <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="RM Code / Details of Aluminium">
                  <input
                    type="text"
                    value={currentValues.aluminiumRmCode}
                    onChange={(event) => updateField("aluminiumRmCode", event.target.value)}
                    disabled={isDerivedOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none disabled:bg-[#f8f9fc] disabled:text-[#9aa4b5]"
                  />
                </Field>

                <Field
                  label="FP Operator code"
                  extra={
                    currentValues.fpCodes.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowViewAllModal("fp")}
                        className="text-[13px] font-bold text-[#0d255f]"
                      >
                        View All
                      </button>
                    ) : null
                  }
                >
                  <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#d9dfec] bg-[#fdfefe] px-[14px] text-[#173069]">
                    <span className={fpPreview ? "" : "text-[#c4ccda]"}>{fpPreview || "Operator Code"}</span>
                    {extraCodesCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowViewAllModal("fp")}
                        className="text-[13px] font-bold text-[#6675ff]"
                      >
                        + {extraCodesCount} More
                      </button>
                    ) : null}
                  </div>
                </Field>

                <Field label="RM Code / Details of Copper tube">
                  <input
                    type="text"
                    value={currentValues.copperTubeRmCode}
                    onChange={(event) => updateField("copperTubeRmCode", event.target.value)}
                    placeholder="Enter RM Code"
                    disabled={!isHpbOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none placeholder:text-[#c4ccda] disabled:bg-[#f8f9fc] disabled:text-[#9aa4b5]"
                  />
                </Field>

                <Field
                  label="HPB operator code"
                  extra={
                    currentValues.hpbCodes.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowViewAllModal("hpb")}
                        className="text-[13px] font-bold text-[#0d255f]"
                      >
                        View All
                      </button>
                    ) : null
                  }
                >
                  <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#d9dfec] bg-[#fdfefe] px-[14px] text-[#173069]">
                    <span className={hpbPreview ? "" : "text-[#c4ccda]"}>
                      {hpbPreview || "Operator Code"}
                    </span>
                    {hpbExtraCodesCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowViewAllModal("hpb")}
                        className="text-[13px] font-bold text-[#6675ff]"
                      >
                        + {hpbExtraCodesCount} More
                      </button>
                    ) : null}
                  </div>
                </Field>

                <Field label="Product count">
                  <input
                    type="text"
                    value={currentValues.productCount}
                    onChange={(event) => updateField("productCount", event.target.value)}
                    placeholder="Enter Product count"
                    disabled={isDerivedOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6] disabled:bg-[#f8f9fc]"
                  />
                </Field>

                <Field label="Lacing operator code">
                  <input
                    type="text"
                    value={currentValues.lacingOperatorCode}
                    onChange={(event) => updateField("lacingOperatorCode", event.target.value)}
                    placeholder="Operator Code"
                    disabled={isDerivedOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Expansion Operator code">
                  <input
                    type="text"
                    value={currentValues.expansionOperatorCode}
                    onChange={(event) => updateField("expansionOperatorCode", event.target.value)}
                    placeholder="Operator Code"
                    disabled={isDerivedOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field
                  label="Brazer Name"
                  extra={
                    currentValues.brazerCodes.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowViewAllModal("br")}
                        className="text-[13px] font-bold text-[#0d255f]"
                      >
                        View All
                      </button>
                    ) : null
                  }
                >
                  {currentValues.brazerCodes.length > 0 ? (
                    <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#d9dfec] bg-[#fdfefe] px-[14px] text-[#173069]">
                      <span>{brazerPreview}</span>
                      {brazerExtraCodesCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowViewAllModal("br")}
                          className="text-[13px] font-bold text-[#6675ff]"
                        >
                          + {brazerExtraCodesCount} More
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={currentValues.brazerName}
                      onChange={(event) => updateField("brazerName", event.target.value)}
                      placeholder="Operator Code"
                      disabled={isDerivedOperator}
                      className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6] disabled:bg-[#f8f9fc]"
                    />
                  )}
                </Field>

                <Field
                  label="Leak Testing Operator Code"
                  extra={
                    currentValues.leakTestingCodes.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowViewAllModal("lt")}
                        className="text-[13px] font-bold text-[#0d255f]"
                      >
                        View All
                      </button>
                    ) : null
                  }
                >
                  {currentValues.leakTestingCodes.length > 0 ? (
                    <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#d9dfec] bg-[#fdfefe] px-[14px] text-[#173069]">
                      <span>{leakTestingPreview}</span>
                      {leakTestingExtraCodesCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowViewAllModal("lt")}
                          className="text-[13px] font-bold text-[#6675ff]"
                        >
                          + {leakTestingExtraCodesCount} More
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={currentValues.leakTestingOperatorCode}
                      onChange={(event) => updateField("leakTestingOperatorCode", event.target.value)}
                      placeholder="Operator Code"
                      disabled={isDerivedOperator}
                      className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6] disabled:bg-[#f8f9fc]"
                    />
                  )}
                </Field>

                <Field label="Types of packing">
                  <div className="relative">
                    <select
                      value={currentValues.packingType}
                      onChange={(event) => updateField("packingType", event.target.value)}
                      disabled={isDerivedOperator}
                      className="h-10 w-full appearance-none rounded-[8px] border border-[#d9dfec] bg-white pr-11 pl-[14px] text-[#173069] outline-none disabled:bg-[#f8f9fc]"
                    >
                      <option value="">Select Code</option>
                      <option value="Box">Box</option>
                      <option value="Crate">Crate</option>
                    </select>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[#8d99ad]"
                    />
                  </div>
                </Field>

                <Field label="Packer Name">
                  <input
                    type="text"
                    value={currentValues.packerName}
                    onChange={(event) => updateField("packerName", event.target.value)}
                    placeholder="Operator Code"
                    disabled={isDerivedOperator}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Inspection Done by inspector at PID Stage">
                  <div className="grid gap-1">
                    <input
                      type="text"
                      value={currentValues.inspectionDoneBy}
                      onChange={(event) => updateField("inspectionDoneBy", event.target.value)}
                      placeholder="Enter packing"
                      disabled={isDerivedOperator && !isInspectorOperator}
                      className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6] disabled:bg-[#f8f9fc]"
                    />
                    {isInspectorOperator ? (
                      <div className="flex justify-between gap-3 text-[14px] font-extrabold">
                        <button
                          type="button"
                          onClick={() => setShowViewAllModal("lt-rejected")}
                          className="text-[#ff1654] underline"
                        >
                          View All (Rejected Codes)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowViewAllModal("lt-approved")}
                          className="text-[#4a20ff] underline"
                        >
                          View All (Approved Codes)
                        </button>
                      </div>
                    ) : null}
                  </div>
                </Field>
              </div>

              {activeSection === "heat-exchanger" &&
              activeStageValue &&
              (isInspectorOperator
                ? missingInspectionSerials || activeStageCodes.length === 0
                : isLeakTestingOperator
                  ? hasMissingLeakTestingCodes
                  : activeStageCodes.length === 0) ? (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGenerateCode}
                    onClick={() => setShowGenerateConfirm(true)}
                    className="flex min-w-[198px] items-center justify-center gap-2 rounded-[8px] bg-[#07bf45] px-6 py-3 text-[16px] font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:blur-[1px] disabled:opacity-45"
                  >
                    <Check size={18} />
                    <span>
                      {orderLookupLoading
                        ? "Checking..."
                        : isInspectorOperator
                          ? "Generate S.No"
                          : "Generate Code"}
                    </span>
                  </button>
                </div>
              ) : null}

              {isInspectorOperator && currentValues.inspectionSerials.length > 0 ? (
                <div className="mt-9 grid gap-5">
                  <p className="text-[16px] font-extrabold text-[#0d255f]">
                    Generated Serial Range: {serialRange} (Final Approved Qty:{" "}
                    {currentValues.inspectionSerials.length})
                  </p>
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,540px)]">
                    <Field label="Serial Number">
                      <input
                        type="text"
                        value={serialRange}
                        readOnly
                        className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#f8f9fc] px-[14px] font-mono text-[#173069] outline-none"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="self-end rounded-[8px] bg-[#162d61] px-6 py-3 text-[16px] font-bold text-white print:hidden"
                    >
                      Print
                    </button>
                  </div>
                  <div className="barcode-print-area hidden print:grid print:grid-cols-1 print:gap-0">
                    {currentValues.inspectionSerials.map((serial) => (
                      <BarcodeSticker key={serial.id} serialNumber={serial.serialNumber} />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </main>

      {showGenerateConfirm ? (
        <ConfirmGenerateModal
          onClose={() => setShowGenerateConfirm(false)}
          onConfirm={handleGenerateConfirm}
        />
      ) : null}

      {showViewAllModal &&
      (showViewAllModal === "hpb"
        ? currentValues.hpbCodes.length > 0
        : showViewAllModal === "br"
          ? currentValues.brazerCodes.length > 0
          : showViewAllModal === "lt" ||
              showViewAllModal === "lt-approved" ||
              showViewAllModal === "lt-rejected"
            ? currentValues.leakTestingCodes.filter((code) =>
                showViewAllModal === "lt-approved"
                  ? code.status === "approved"
                  : showViewAllModal === "lt-rejected"
                    ? code.status === "rejected"
                    : true
              ).length > 0
            : currentValues.fpCodes.length > 0) ? (
        <FpCodesModal
          title={
            showViewAllModal === "hpb"
              ? "HPB Operator Codes"
              : showViewAllModal === "br"
                ? "Brazer Operator Codes"
                : showViewAllModal === "lt" ||
                    showViewAllModal === "lt-approved" ||
                    showViewAllModal === "lt-rejected"
                  ? `Leak Testing Operator Codes${
                      showViewAllModal === "lt-approved"
                        ? " (Approved)"
                        : showViewAllModal === "lt-rejected"
                          ? " (Rejected)"
                          : ""
                    }`
                  : "FP Operator Codes"
          }
          codes={
            showViewAllModal === "hpb"
              ? currentValues.hpbCodes
              : showViewAllModal === "br"
                ? currentValues.brazerCodes
                : showViewAllModal === "lt" ||
                    showViewAllModal === "lt-approved" ||
                    showViewAllModal === "lt-rejected"
                  ? currentValues.leakTestingCodes.filter((code) =>
                      showViewAllModal === "lt-approved"
                        ? code.status === "approved"
                        : showViewAllModal === "lt-rejected"
                          ? code.status === "rejected"
                          : true
                    )
                  : currentValues.fpCodes
          }
          lockResolvedStatuses={
            showViewAllModal === "lt" ||
            showViewAllModal === "lt-approved" ||
            showViewAllModal === "lt-rejected"
          }
          onClose={() => setShowViewAllModal(null)}
          onSave={handleSaveStatuses}
        />
      ) : null}
    </div>
  );
}
