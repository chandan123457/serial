import { X } from "lucide-react";

export default function AdminModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[500px] rounded-3xl bg-white px-10 py-9 shadow-[0_22px_50px_rgba(20,36,85,0.24)]">
        <div className="mb-10 flex items-start justify-between">
          <h3 className="text-[22px] font-extrabold text-[#172d63]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#6f7c92] transition hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={28} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
