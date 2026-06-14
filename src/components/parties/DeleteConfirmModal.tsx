"use client";

export function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[400px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Party?</h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="text-[13.5px] text-gray-500 mb-6">
          Are you sure you want to delete this party?
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-[13px] border border-[#e0e0e0] rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            No, Keep
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
