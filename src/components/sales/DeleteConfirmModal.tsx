"use client";

import { X } from "lucide-react";

export function DeleteConfirmModal({
  invoiceNo,
  onConfirm,
  onCancel,
}: {
  invoiceNo: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Sales Invoice?</h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50 flex-shrink-0 ml-3"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Are you sure you want to delete this transaction?{" "}
          The transaction cannot be recovered once it has been deleted.
        </p>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onConfirm}
            className="text-[13.5px] text-gray-700 font-medium hover:text-red-500 transition-colors px-2"
          >
            Yes, Delete
          </button>
          <button
            onClick={onCancel}
            className="text-[13.5px] font-semibold bg-red-500 text-white rounded-xl px-5 py-2 hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
