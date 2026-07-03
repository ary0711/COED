interface Props {
   stats: any[];
  setStats: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}


export function StatsEditor({
  stats,
  setStats,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Stats
      </h2>

      {stats.map((stat, index) => (
        <div
          key={stat.id}
          className="border rounded p-4 mb-4"
        >
          <input
            className="w-full border p-2 rounded mb-2"
            value={stat.value}
            placeholder="Value"
            onChange={(e) => {
              const updated = [...stats];
              updated[index].value =
                e.target.value;
              setStats(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded"
            value={stat.label}
            placeholder="Label"
            onChange={(e) => {
              const updated = [...stats];
              updated[index].label =
                e.target.value;
              setStats(updated);
            }}
          />
        </div>
      ))}
    </div>
  );
}