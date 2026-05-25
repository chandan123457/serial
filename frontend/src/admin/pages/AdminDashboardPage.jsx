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
  fetchAdminBootstrap,
  updateAdminUser
} from "../adminApi";

export default function AdminDashboardPage({ session, onLogout }) {
  const [users, setUsers] = useState([]);
  const [modelNumbers, setModelNumbers] = useState([]);
  const [operatorTypes, setOperatorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const pageTitle = useMemo(() => "Dashboard", []);

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

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f3f6fb] xl:grid-cols-[280px_minmax(0,1fr)]">
      <AdminSidebar username={session?.user?.username ?? "Admin"} onLogout={onLogout} />

      <main className="px-5 py-5 sm:px-8">
        <h1 className="mb-6 text-[27px] font-extrabold text-[#172d63]">{pageTitle}</h1>

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

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#f3c3c3] bg-[#fff0f0] px-5 py-3 text-[#9c2f2f]">
            {error}
          </div>
        ) : null}

        {loading ? (
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
