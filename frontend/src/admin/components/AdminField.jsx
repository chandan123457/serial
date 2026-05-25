import { ChevronDown } from "lucide-react";

export default function AdminField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  select = false,
  options = [],
  disabled = false
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[15px] font-bold text-[#31445f]">{label}</span>
      <div className="relative">
        {select ? (
          <>
            <select
              value={value}
              onChange={onChange}
              disabled={disabled}
              className="h-11 w-full appearance-none rounded-xl border border-[#dce3f0] bg-white px-4 pr-10 text-[15px] text-[#24385b] outline-none disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#65748c]"
            />
          </>
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-[#dce3f0] bg-white px-4 text-[15px] text-[#24385b] outline-none placeholder:text-[#b5bfce] disabled:bg-slate-50"
          />
        )}
      </div>
    </label>
  );
}
