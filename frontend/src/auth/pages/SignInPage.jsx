import { useState } from "react";
import { login } from "../authApi";
import appLogo from "../../../assets/icon.ico";

const roles = [
  { key: "admin", label: "Admin Login" },
  { key: "user", label: "User Login" }
];

function LogoMark() {
  return (
    <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white p-2 shadow-sm" aria-hidden="true">
      <img src={appLogo} alt="" className="h-full w-full rounded-full object-contain" />
    </div>
  );
}

export default function SignInPage({ onLogin }) {
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const session = await login({ role, username, password });
      onLogin(session);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#eef3fb] px-4 py-10">
      <div className="grid w-full max-w-[980px] overflow-hidden rounded-[32px] bg-white shadow-[0_24px_60px_rgba(17,39,89,0.16)] lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="flex flex-col justify-between bg-[#122551] px-8 py-10 text-white">
          <div>
            <LogoMark />
            <div className="mt-8">
              <h1 className="text-[30px] font-extrabold">Pragya Refrigeration</h1>
              <p className="mt-2 text-[17px] text-white/80">&amp; Electricals Pvt. Ltd.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/6 p-5 text-[15px] text-white/80">
            Secure access for admin panel and operator dashboard.
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-8">
            <h2 className="text-[30px] font-extrabold text-[#172d63]">Sign In</h2>
            <p className="mt-2 text-[15px] text-[#6e7d92]">
              Choose login type and continue with your credentials.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#edf2fa] p-2">
            {roles.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRole(item.key)}
                className={`rounded-xl px-4 py-3 text-[15px] font-bold transition ${
                  role === item.key
                    ? "bg-[#ffc514] text-[#172d63]"
                    : "bg-transparent text-[#44546f]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-[15px] font-bold text-[#31445f]">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={role === "admin" ? "Enter admin username" : "Enter username"}
                className="h-12 rounded-xl border border-[#dce3f0] px-4 text-[15px] text-[#24385b] outline-none placeholder:text-[#b5bfce]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[15px] font-bold text-[#31445f]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="h-12 rounded-xl border border-[#dce3f0] px-4 text-[15px] text-[#24385b] outline-none placeholder:text-[#b5bfce]"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-[#f3c3c3] bg-[#fff0f0] px-4 py-3 text-[14px] text-[#9c2f2f]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-[#203c74] px-5 py-3 text-[16px] font-bold text-white transition hover:brightness-95 disabled:opacity-70"
            >
              {loading ? "Signing In..." : role === "admin" ? "Open Admin Panel" : "Open User Panel"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
