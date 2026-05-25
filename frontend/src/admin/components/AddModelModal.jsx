import { useEffect, useState } from "react";
import AdminField from "./AdminField";
import AdminModal from "./AdminModal";

export default function AddModelModal({ onClose, onSubmit }) {
  const [modelNumber, setModelNumber] = useState("");

  useEffect(() => {
    setModelNumber("");
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ modelNumber });
    setModelNumber("");
  }

  return (
    <AdminModal title="+ Model Number" onClose={onClose}>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <AdminField
          label="Modal Number"
          value={modelNumber}
          onChange={(event) => setModelNumber(event.target.value)}
          placeholder="XXXXXX"
        />
        <div className="mt-1 flex justify-center">
          <button
            type="submit"
            className="min-w-[140px] rounded-xl bg-[#ffc514] px-6 py-3 text-[20px] font-bold text-[#162d61] transition hover:brightness-95"
          >
            + Add
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
