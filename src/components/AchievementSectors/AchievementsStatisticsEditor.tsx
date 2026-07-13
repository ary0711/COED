interface Props {
  statistics: any[];
  setStatistics: React.Dispatch<any>;
}

export function AchievementsStatisticsEditor({
  statistics,
  setStatistics,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        Statistics
      </h2>

      {statistics.map((stat, index) => (
        <div
          key={stat.id}
          className="border p-4 rounded mb-4"
        >
          <input
            className="w-full border p-2 mb-2 rounded"
            value={stat.label}
            onChange={(e) => {
              const updated = [...statistics];

              updated[index].label =
                e.target.value;

              setStatistics(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded"
            value={stat.value}
            onChange={(e) => {
              const updated = [...statistics];

              updated[index].value =
                e.target.value;

              setStatistics(updated);
            }}
          />
        </div>
      ))}
    </div>
  );
}