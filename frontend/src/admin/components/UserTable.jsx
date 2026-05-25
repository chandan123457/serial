import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "../adminUtils";

export default function UserTable({ users, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white p-8 shadow-[0_12px_30px_rgba(17,39,89,0.08)]">
      <div className="mb-4">
        <h2 className="text-[24px] font-extrabold text-[#173069]">User List</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-[#e5ebf4] text-left text-[14px] font-bold text-[#6e7d92]">
              <th className="pb-4">Username</th>
              <th className="pb-4">Operator Type</th>
              <th className="pb-4">Operator No.</th>
              <th className="pb-4">Created Date</th>
              <th className="pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#eef2f8]">
                <td className="py-7 text-[18px] text-[#173069]">{user.username}</td>
                <td className="py-7 text-[18px] text-[#173069]">{user.operatorTypeLabel}</td>
                <td className="py-7 text-[18px] text-[#173069]">{user.operatorNumber}</td>
                <td className="py-7 text-[18px] text-[#173069]">{formatDate(user.createdAt)}</td>
                <td className="py-7">
                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="text-[#173069] transition hover:text-[#33559c]"
                      aria-label={`Edit ${user.username}`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user.id)}
                      className="text-[#173069] transition hover:text-[#b52f2f]"
                      aria-label={`Delete ${user.username}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#6e7d92]">
                  No users added yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
