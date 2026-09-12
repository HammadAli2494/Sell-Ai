const tones = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  PROCESSING: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  SHIPPED: "bg-sky-50 text-sky-800 ring-sky-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
  Active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Hidden: "bg-gray-50 text-gray-600 ring-gray-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        tones[status] || "bg-gray-50 text-gray-700 ring-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
