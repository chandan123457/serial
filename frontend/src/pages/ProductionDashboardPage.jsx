import { useEffect, useMemo, useState } from "react";
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
  generateFpOperatorCodes,
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
    hpbOperatorCode: "",
    productCount: "",
    lacingOperatorCode: "",
    expansionOperatorCode: "",
    brazerName: "",
    leakTestingOperatorCode: "",
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

function FpCodesModal({ codes, onClose, onSave }) {
  const [localCodes, setLocalCodes] = useState(codes);

  function setStatus(index, status) {
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
          <h3 className="text-[17px] font-extrabold text-[#172d63]">FP Operator Codes</h3>
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
              {localCodes.map((code, index) => (
                <tr key={code.value} className="border-b border-[#edf2f8]">
                  <td className="px-4 py-4 text-[15px] text-[#24385b]">{index + 1}</td>
                  <td className="px-4 py-4 text-[15px] text-[#24385b]">{code.value}</td>
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
                </tr>
              ))}
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

function buildFpCodeValue(operatorNumber, dateValue, serial) {
  const operatorPrefix = operatorNumber.replace("-", "");
  const dateParts = getDateCodeParts(dateValue);
  const formattedDate = fpCodeFormat.dateParts
    .map((part) => dateParts[part])
    .filter(Boolean)
    .join(fpCodeFormat.separator);

  return [operatorPrefix, formattedDate, serial]
    .filter((part) => part !== "")
    .join(fpCodeFormat.separator);
}

export default function ProductionDashboardPage({ session, onLogout }) {
  const [activeSection, setActiveSection] = useState("heat-exchanger");
  const [modelNumbers, setModelNumbers] = useState([]);
  const [sectionState, setSectionState] = useState(initialSectionState);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [orderLookupLoading, setOrderLookupLoading] = useState(false);

  const currentSection = useMemo(
    () => sections.find((section) => section.id === activeSection) ?? sections[0],
    [activeSection]
  );

  const currentValues = sectionState[activeSection];
  const fpPreview = currentValues.fpCodes[0]?.value ?? "";
  const extraCodesCount = Math.max(currentValues.fpCodes.length - 1, 0);
  const hasRequiredInputParameters =
    currentValues.modelNumberId &&
    Number(currentValues.quantity) > 0 &&
    currentValues.dateOfManufacturing &&
    currentValues.orderId.trim();
  const canGenerateCode =
    activeSection === "heat-exchanger" &&
    hasRequiredInputParameters &&
    currentValues.aluminiumRmCode.trim() &&
    session?.user?.operatorNumber &&
    currentValues.fpCodes.length === 0 &&
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

        setSectionState((current) => ({
          ...current,
          [activeSection]: {
            ...current[activeSection],
            modelNumberId: firstCode.modelNumberId ?? "",
            quantity: String(firstCode.quantity ?? response.codes.length),
            dateOfManufacturing: firstCode.manufacturingDate ?? "",
            orderId: firstCode.orderId ?? current[activeSection].orderId,
            aluminiumRmCode: firstCode.rmCode ?? "",
            fpCodes: response.codes.map((code) => ({
              id: code.id,
              serial: Number(code.serial),
              value: buildFpCodeValue(
                code.operatorNumber,
                code.manufacturingDate,
                Number(code.serial)
              ),
              status: code.status
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
  }, [activeSection, currentValues.orderId]);

  function updateField(field, value) {
    setSectionState((current) => ({
      ...current,
      [activeSection]: {
        ...current[activeSection],
        [field]: value,
        ...(field === "orderId" && current[activeSection].orderId !== value
          ? { fpCodes: [] }
          : {})
      }
    }));
  }

  async function handleGenerateConfirm() {
    const response = await generateFpOperatorCodes({
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
      value: buildFpCodeValue(
        code.operatorNumber,
        code.manufacturingDate,
        Number(code.serial)
      ),
      status: code.status
    }));

    setSectionState((current) => ({
      ...current,
      [activeSection]: {
        ...current[activeSection],
        fpCodes: nextCodes
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
        fpCodes: nextCodes.map((code) => ({
          ...code,
          status: statusesById.has(code.id) ? statusesById.get(code.id) : code.status
        }))
      }
    }));
    setShowViewAllModal(false);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f5f7fb] lg:grid-cols-[280px_minmax(0,1fr)]">
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
                      className="h-10 w-full appearance-none rounded-[8px] border border-[#d9dfec] bg-white pr-11 pl-[14px] text-[#173069] outline-none"
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
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none"
                  />
                </Field>

                <Field label="Date of Manufacturing">
                  <input
                    type="date"
                    value={currentValues.dateOfManufacturing}
                    onChange={(event) => updateField("dateOfManufacturing", event.target.value)}
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none"
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
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none"
                  />
                </Field>

                <Field
                  label="FP Operator code"
                  extra={
                    currentValues.fpCodes.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowViewAllModal(true)}
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
                        onClick={() => setShowViewAllModal(true)}
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
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none placeholder:text-[#c4ccda]"
                  />
                </Field>

                <Field label="HPB operator code">
                  <input
                    type="text"
                    value={currentValues.hpbOperatorCode}
                    onChange={(event) => updateField("hpbOperatorCode", event.target.value)}
                    placeholder="Operator Code"
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Product count">
                  <input
                    type="text"
                    value={currentValues.productCount}
                    onChange={(event) => updateField("productCount", event.target.value)}
                    placeholder="Enter Product count"
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Lacing operator code">
                  <input
                    type="text"
                    value={currentValues.lacingOperatorCode}
                    onChange={(event) => updateField("lacingOperatorCode", event.target.value)}
                    placeholder="Operator Code"
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Expansion Operator code">
                  <input
                    type="text"
                    value={currentValues.expansionOperatorCode}
                    onChange={(event) => updateField("expansionOperatorCode", event.target.value)}
                    placeholder="Operator Code"
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Brazer Name">
                  <input
                    type="text"
                    value={currentValues.brazerName}
                    onChange={(event) => updateField("brazerName", event.target.value)}
                    placeholder="Operator Code"
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Leak Testing Operator Code">
                  <input
                    type="text"
                    value={currentValues.leakTestingOperatorCode}
                    onChange={(event) => updateField("leakTestingOperatorCode", event.target.value)}
                    placeholder="Operator Code"
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Types of packing">
                  <div className="relative">
                    <select
                      value={currentValues.packingType}
                      onChange={(event) => updateField("packingType", event.target.value)}
                      className="h-10 w-full appearance-none rounded-[8px] border border-[#d9dfec] bg-white pr-11 pl-[14px] text-[#173069] outline-none"
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
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-[#fbfcff] px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>

                <Field label="Inspection Done by inspector at PID Stage">
                  <input
                    type="text"
                    value={currentValues.inspectionDoneBy}
                    onChange={(event) => updateField("inspectionDoneBy", event.target.value)}
                    placeholder="Enter packing"
                    className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white px-[14px] text-[#173069] outline-none placeholder:text-[#d2d9e6]"
                  />
                </Field>
              </div>

              {activeSection === "heat-exchanger" &&
              currentValues.aluminiumRmCode.trim() &&
              currentValues.fpCodes.length === 0 ? (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGenerateCode}
                    onClick={() => setShowGenerateConfirm(true)}
                    className="flex min-w-[198px] items-center justify-center gap-2 rounded-[8px] bg-[#07bf45] px-6 py-3 text-[16px] font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:blur-[1px] disabled:opacity-45"
                  >
                    <Check size={18} />
                    <span>{orderLookupLoading ? "Checking..." : "Generate Code"}</span>
                  </button>
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

      {showViewAllModal && currentValues.fpCodes.length > 0 ? (
        <FpCodesModal
          codes={currentValues.fpCodes}
          onClose={() => setShowViewAllModal(false)}
          onSave={handleSaveStatuses}
        />
      ) : null}
    </div>
  );
}
