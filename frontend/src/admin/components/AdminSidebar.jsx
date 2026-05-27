import { LogOut } from "lucide-react";
import { sidebarItems } from "../adminData";
import appLogo from "../../../assets/icon.ico";

function LogoMark() {
  return (
    <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white p-1.5" aria-hidden="true">
      <img src={appLogo} alt="" className="h-full w-full rounded-full object-contain" />
    </div>
  );
}

export default function AdminSidebar({ username, activeItem = "dashboard", onNavigate, onLogout }) {
  return (
    <aside className="flex min-h-screen flex-col bg-[#101d3a] text-white xl:sticky xl:top-0 xl:h-screen xl:min-h-0 xl:overflow-hidden">
      <div className="border-b border-white/5 px-4 py-7">
        <div className="grid justify-items-center gap-4 text-center">
          <LogoMark />
          <div>
            <h1 className="text-[17px] font-extrabold">Pragya Refrigeration</h1>
            <p className="text-[15px] text-[#d9dfec]">&amp; Electricals Pvt. Ltd.</p>
          </div>
        </div>
      </div>

      <nav className="px-4 py-8">
        <div className="grid gap-3">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate?.(item.key)}
              className={`rounded-xl px-5 py-4 text-center text-[17px] font-bold ${
                item.key === activeItem
                  ? "bg-[#ffc514] text-[#172d63]"
                  : "bg-transparent text-white/90 hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-auto px-2 pb-5">
        <div className="mb-3 rounded-xl bg-[#1b2948] px-4 py-3 text-center text-[15px] font-semibold text-white/85">
          {username}
        </div>
        <div className="mb-3 h-6 rounded-lg bg-[#1b2948]" />
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#8e2742] bg-[#2a1530] px-4 py-4 text-[17px] font-bold text-[#ff9db2]"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
