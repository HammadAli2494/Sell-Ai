function SalesChart({ series }) {
  const max = Math.max(...series.map((point) => point.sales), 1);

  if (!series.length) {
    return <p className="text-sm text-muted">No sales in this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex h-44 min-w-[16rem] items-end gap-1.5">
        {series.map((point) => (
          <div
            key={point.date}
            className="flex min-w-2 flex-1 flex-col justify-end"
            title={`${point.date}: ${point.sales.toFixed(2)} (${point.orders} orders)`}
          >
            <div
              className="w-full rounded-t-md bg-brand"
              style={{ height: point.sales ? `${Math.max(4, (point.sales / max) * 100)}%` : "0%" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default SalesChart;
