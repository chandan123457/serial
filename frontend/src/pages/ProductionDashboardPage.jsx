import { useMemo, useState } from "react";
import {
  Flame,
  Waves,
  Snowflake,
  CalendarDays,
  ChevronDown,
  LogOut
} from "lucide-react";

const sections = [
  { id: "heat-exchanger", label: "Heat Exchanger", icon: Flame },
  { id: "condensing-unit", label: "Condensing Unit", icon: Waves },
  { id: "evaporator-unit", label: "Evaporator Unit", icon: Snowflake }
];

const topFields = [
  { label: "Model Number", placeholder: "Select Model Number", type: "select" },
  { label: "Quantity", placeholder: "Enter Quantity", type: "text" },
  { label: "Date of Manufacturing", placeholder: "dd/mm/yyyy", type: "date" },
  { label: "Order ID", placeholder: "Enter Order ID", type: "text" }
];

const attributeFields = [
  { label: "RM Code / Details of Aluminium", placeholder: "Enter RM Code", type: "text" },
  { label: "FP Operator code", placeholder: "Operator Code", type: "text" },
  { label: "RM Code / Details of Copper tube", placeholder: "Enter RM Code", type: "text" },
  { label: "HPB operator code", placeholder: "Operator Code", type: "text" },
  { label: "Product count", placeholder: "Enter Product count", type: "text" },
  { label: "Lacing operator code", placeholder: "Operator Code", type: "text" },
  { label: "Expansion Operator code", placeholder: "Operator Code", type: "text" },
  { label: "Brazer Name", placeholder: "Operator Code", type: "text" },
  { label: "Leak Testing Operator Code", placeholder: "Operator Code", type: "text" },
  { label: "Types of packing", placeholder: "Select Code", type: "select" },
  { label: "Packer Name", placeholder: "Operator Code", type: "text" },
  {
    label: "Inspection Done by inspector at PID Stage",
    placeholder: "Enter packing",
    type: "text"
  }
];

function LogoMark() {
  return (
    <div
      className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white"
      aria-hidden="true"
    >
      <div className="relative grid h-[42px] w-[42px] place-items-center rounded-full border-2 border-[#e1ebfa] text-[#1994d5]">
        <span className="absolute top-[7px] h-4 w-4 rounded-full border-t-[3px] border-t-[#1994d5] border-r-[3px] border-r-transparent border-b-[3px] border-b-transparent border-l-[3px] border-l-transparent" />
        <span className="mt-3 text-[10px] font-extrabold">PR</span>
      </div>
    </div>
  );
}

function InputField({ field }) {
  const isDate = field.type === "date";
  const isSelect = field.type === "select";

  return (
    <label className="grid gap-2">
      <span className="text-[13px] leading-[1.2] font-bold text-[#0f255b]">{field.label}</span>
      <div className="relative">
        <input
          type="text"
          placeholder={field.placeholder}
          readOnly={isDate || isSelect}
          className="h-10 w-full rounded-[8px] border border-[#d9dfec] bg-white pr-11 pl-[14px] text-[#173069] outline-none placeholder:text-[#b6bece]"
        />
        {isDate && (
          <CalendarDays
            size={18}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[#233355]"
          />
        )}
        {isSelect && (
          <ChevronDown
            size={18}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[#233355]"
          />
        )}
      </div>
    </label>
  );
}

export default function ProductionDashboardPage({ session, onLogout }) {
  const [activeSection, setActiveSection] = useState("heat-exchanger");

  const currentSection = useMemo(
    () => sections.find((section) => section.id === activeSection) ?? sections[0],
    [activeSection]
  );

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

          <div className="min-h-auto rounded-2xl bg-white px-[22px] pt-[22px] pb-7 shadow-[0_8px_28px_rgba(17,39,89,0.08)] lg:min-h-[calc(100vh-96px)]">
            <section>
              <h3 className="mb-[18px] text-[18px] leading-[1.2] font-extrabold text-[#0d255f]">
                Input Parameters
              </h3>
              <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                {topFields.map((field) => (
                  <InputField key={field.label} field={field} />
                ))}
              </div>
            </section>

            <section className="mt-[38px]">
              <h3 className="mb-[18px] text-[18px] leading-[1.2] font-extrabold text-[#0d255f]">
                Attributes
              </h3>
              <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                {attributeFields.map((field) => (
                  <InputField key={field.label} field={field} />
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
