interface Props {
  stats: any[];
  setStats: React.Dispatch<any>;
}

export function AchievementsBannerStatsEditor({
  stats,
  setStats,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        Banner Statistics
      </h2>

      {stats.map((stat, index) => (
        <div
          key={stat.id}
          className="border rounded p-4 mb-4"
        >
          <input
            className="w-full border p-2 rounded mb-2"
            value={stat.title}
            onChange={(e) => {
              const updated = [...stats];

              updated[index].title =
                e.target.value;

              setStats(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded"
            value={stat.value}
            onChange={(e) => {
              const updated = [...stats];

              updated[index].value =
                e.target.value;

              setStats(updated);
            }}
          />
        </div>
      ))}
    </div>
  );
}