import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import UserTable from "../components/UserTable";
import ModelListCard from "../components/ModelListCard";
import AddUserModal from "../components/AddUserModal";
import AddModelModal from "../components/AddModelModal";
import {
  createAdminUser,
  createModelNumber,
  deleteAdminUser,
  deleteModelNumber,
  fetchBarcodeDetails,
  fetchAdminBootstrap,
  updateAdminUser
} from "../adminApi";

function FieldlessSearch({ value, onChange, onSearch }) {
  return (
    <div className="grid gap-2">
      <label className="text-[14px] font-extrabold text-[#233355]">Serial Number</label>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-xl border border-[#d8e1f0] px-5 font-mono text-[#173069] outline-none"
        />
        <button
          type="button"
          onClick={onSearch}
          className="rounded-xl bg-[#203c74] px-6 py-3 text-[15px] font-extrabold text-white"
        >
          Search
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage({ session, onLogout }) {
  const [users, setUsers] = useState([]);
  const [modelNumbers, setModelNumbers] = useState([]);
  const [operatorTypes, setOperatorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [serialSearch, setSerialSearch] = useState("");
  const [barcodeDetails, setBarcodeDetails] = useState(null);

  const pageTitle = useMemo(
    () => (activePage === "barcode-details" ? "Barcode Details" : "Dashboard"),
    [activePage]
  );

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBootstrap();
      setUsers(data.users);
      setModelNumbers(data.modelNumbers);
      setOperatorTypes(data.operatorTypes);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleAddUser(form) {
    try {
      if (!editingUser && !form.password) {
        throw new Error("Password is required");
      }

      if (editingUser) {
        const payload = {
          username: form.username,
          operatorType: form.operatorType,
          operatorNumber: form.operatorNumber
        };

        if (form.password) {
          payload.password = form.password;
        }

        const updatedUser = await updateAdminUser(editingUser.id, payload);
        setUsers((current) =>
          current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );
      } else {
        const createdUser = await createAdminUser(form);
        setUsers((current) => [createdUser, ...current]);
      }

      setShowAddUser(false);
      setEditingUser(null);
      setError("");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleDeleteUser(userId) {
    try {
      await deleteAdminUser(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleAddModel(payload) {
    try {
      const createdModel = await createModelNumber(payload);
      setModelNumbers((current) => [createdModel, ...current]);
      setShowAddModel(false);
      setError("");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleDeleteModel(modelId) {
    try {
      await deleteModelNumber(modelId);
      setModelNumbers((current) => current.filter((model) => model.id !== modelId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleSerialSearch() {
    try {
      setError("");
      const details = await fetchBarcodeDetails(serialSearch.trim());
      setBarcodeDetails(details);
    } catch (searchError) {
      setBarcodeDetails(null);
      setError(searchError.message);
    }
  }

  function DetailTile({ label, value }) {
    return (
      <div className="rounded-xl border border-[#d8e1f0] bg-[#f8fbff] p-4">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#6f7f9b]">{label}</p>
        <p className="mt-2 text-[15px] font-extrabold text-[#101d3a]">{value || "-"}</p>
      </div>
    );
  }

  function BarcodeDetailsView() {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-[0_12px_30px_rgba(17,39,89,0.08)]">
        <FieldlessSearch
          value={serialSearch}
          onChange={setSerialSearch}
          onSearch={handleSerialSearch}
        />

        {barcodeDetails ? (
          <div className="mt-8">
            <h2 className="text-center text-[24px] font-extrabold text-[#12285c]">Serial Number Details</h2>
            <div className="mx-auto mt-3 h-[2px] w-[72px] bg-[#ffd20c]" />
            <div className="mt-7 grid gap-3 md:grid-cols-2">
              <DetailTile label="Serial Number" value={barcodeDetails.serialNumber} />
              <DetailTile label="Module Name" value={barcodeDetails.moduleName} />
              <DetailTile label="Order ID" value={barcodeDetails.orderId} />
              <DetailTile label="Model Number" value={barcodeDetails.modelNumber} />
              <DetailTile label="RM Code / Aluminium Details" value={barcodeDetails.aluminiumDetails} />
              <DetailTile label="RM Code / Copper Tube Details" value={barcodeDetails.copperTubeDetails} />
              <DetailTile label="Inspection Done by inspector at PID Stage" value={barcodeDetails.inspectionNote} />
            </div>

            <h3 className="mt-7 inline-block border-b-2 border-[#ffd20c] pb-2 text-[14px] font-extrabold text-[#233355]">
              Operator Flow
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {barcodeDetails.operatorFlow.map((item) => (
                <div key={item.key} className="overflow-hidden rounded-xl border border-[#d8e1f0]">
                  <div className="bg-[#12285c] px-4 py-3 text-[14px] font-extrabold uppercase text-white">
                    {item.label}
                  </div>
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] border-b border-[#edf2f8] px-4 py-3 text-[14px]">
                    <span className="font-bold text-[#51627f]">Code</span>
                    <span>{item.code}</span>
                  </div>
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] border-b border-[#edf2f8] bg-[#f8fbff] px-4 py-3 text-[14px]">
                    <span className="font-bold text-[#51627f]">Status</span>
                    <span
                      className={`w-fit rounded-full px-7 py-1 text-[13px] font-extrabold ${
                        item.status === "approved"
                          ? "bg-[#cfffe3] text-[#087f3d]"
                          : item.status === "rejected"
                            ? "bg-[#ffe1e8] text-[#c91545]"
                            : "bg-[#e5e8ee] text-[#4d596b]"
                      }`}
                    >
                      {item.status === "approved"
                        ? "Approved"
                        : item.status === "rejected"
                          ? "Rejected"
                          : "Untouched"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] px-4 py-3 text-[14px]">
                    <span className="font-bold text-[#51627f]">Username</span>
                    <span>{item.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-[280px] place-items-center text-center text-[#8390a8]">
            <div>
              <div className="text-[54px] leading-none">#</div>
              <p className="mt-5 text-[16px] font-bold text-[#63728d]">
                Search a serial number to view barcode details
              </p>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f3f6fb] xl:grid-cols-[280px_minmax(0,1fr)]">
      <AdminSidebar
        username={session?.user?.username ?? "Admin"}
        activeItem={activePage}
        onNavigate={setActivePage}
        onLogout={onLogout}
      />

      <main className="px-5 py-5 sm:px-8">
        <h1 className="mb-6 text-[27px] font-extrabold text-[#172d63]">{pageTitle}</h1>

        {activePage === "dashboard" ? (
          <section className="rounded-3xl bg-white p-8 shadow-[0_12px_30px_rgba(17,39,89,0.08)]">
            <h2 className="mb-6 text-[22px] font-extrabold text-[#173069]">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setShowAddUser(true);
                }}
                className="rounded-xl bg-[#203c74] px-6 py-3 text-[16px] font-bold text-white"
              >
                + Add User
              </button>
              <button
                type="button"
                onClick={() => setShowAddModel(true)}
                className="rounded-xl bg-[#ffc514] px-6 py-3 text-[16px] font-bold text-[#172d63]"
              >
                + Model Number
              </button>
            </div>
          </section>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#f3c3c3] bg-[#fff0f0] px-5 py-3 text-[#9c2f2f]">
            {error}
          </div>
        ) : null}

        {activePage === "barcode-details" ? (
          <BarcodeDetailsView />
        ) : loading ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-[#6e7d92] shadow-[0_12px_30px_rgba(17,39,89,0.08)]">
            Loading dashboard...
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            <UserTable
              users={users}
              onEdit={(user) => {
                setEditingUser(user);
                setShowAddUser(true);
              }}
              onDelete={handleDeleteUser}
            />
            <ModelListCard modelNumbers={modelNumbers} onDelete={handleDeleteModel} />
          </div>
        )}
      </main>

      {showAddUser ? (
        <AddUserModal
          operatorTypes={operatorTypes}
          editingUser={editingUser}
          onClose={() => {
            setShowAddUser(false);
            setEditingUser(null);
          }}
          onSubmit={handleAddUser}
        />
      ) : null}

      {showAddModel ? (
        <AddModelModal onClose={() => setShowAddModel(false)} onSubmit={handleAddModel} />
      ) : null}
    </div>
  );
}
