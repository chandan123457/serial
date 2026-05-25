import { Trash2 } from "lucide-react";
import { formatDate } from "../adminUtils";

export default function ModelListCard({ modelNumbers, onDelete }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white p-8 shadow-[0_12px_30px_rgba(17,39,89,0.08)]">
      <div className="mb-4">
        <h2 className="text-[24px] font-extrabold text-[#173069]">Model Numbers</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-[#e5ebf4] text-left text-[14px] font-bold text-[#6e7d92]">
              <th className="pb-4">Model Number</th>
              <th className="pb-4">Created Date</th>
              <th className="pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modelNumbers.map((model) => (
              <tr key={model.id} className="border-b border-[#eef2f8]">
                <td className="py-6 text-[18px] text-[#173069]">{model.modelNumber}</td>
                <td className="py-6 text-[18px] text-[#173069]">{formatDate(model.createdAt)}</td>
                <td className="py-6">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => onDelete(model.id)}
                      className="text-[#173069] transition hover:text-[#b52f2f]"
                      aria-label={`Delete ${model.modelNumber}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {modelNumbers.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 text-center text-[#6e7d92]">
                  No model numbers added yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
