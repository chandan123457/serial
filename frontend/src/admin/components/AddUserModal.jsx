import { useEffect, useMemo, useState } from "react";
import AdminField from "./AdminField";
import AdminModal from "./AdminModal";

function getInitialState(user) {
  return {
    username: user?.username ?? "",
    password: "",
    operatorType: user?.operatorType ?? "",
    operatorNumber: user?.operatorNumber ?? ""
  };
}

export default function AddUserModal({ operatorTypes, editingUser, onClose, onSubmit }) {
  const [form, setForm] = useState(() => getInitialState(editingUser));

  useEffect(() => {
    setForm(getInitialState(editingUser));
  }, [editingUser]);

  const operatorTypeOptions = useMemo(
    () =>
      operatorTypes.map((type) => ({
        value: type.key,
        label: type.label
      })),
    [operatorTypes]
  );

  const operatorNumberOptions = useMemo(() => {
    const selected = operatorTypes.find((type) => type.key === form.operatorType);
    return (selected?.values ?? []).map((value) => ({
      value,
      label: value
    }));
  }, [form.operatorType, operatorTypes]);

  const submitLabel = editingUser ? "Save" : "+ Add";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <AdminModal title={editingUser ? "Edit User" : "+ Add User"} onClose={onClose}>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <AdminField
          label="Username"
          value={form.username}
          onChange={(event) => updateField("username", event.target.value)}
          placeholder="Enter username"
        />
        <AdminField
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder={editingUser ? "Enter new password" : "Enter password"}
        />
        <AdminField
          label="Operator Type"
          select
          value={form.operatorType}
          onChange={(event) => {
            const nextType = event.target.value;
            setForm((current) => ({
              ...current,
              operatorType: nextType,
              operatorNumber: ""
            }));
          }}
          placeholder="Select Operator Type"
          options={operatorTypeOptions}
        />
        <AdminField
          label="Operator No."
          select
          value={form.operatorNumber}
          onChange={(event) => updateField("operatorNumber", event.target.value)}
          placeholder="Select Operator No."
          options={operatorNumberOptions}
          disabled={!form.operatorType}
        />

        <div className="mt-1 flex justify-center">
          <button
            type="submit"
            className="min-w-[140px] rounded-xl bg-[#ffc514] px-6 py-3 text-[20px] font-bold text-[#162d61] transition hover:brightness-95"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
