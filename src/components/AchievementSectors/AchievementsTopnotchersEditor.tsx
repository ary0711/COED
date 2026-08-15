interface Props {
  topnotchers: any[];
  setTopnotchers: React.Dispatch<any>;
}

export function AchievementsTopnotchersEditor({
  topnotchers,
  setTopnotchers,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        Topnotchers
      </h2>

      {topnotchers.map((item, index) => (
        <div
          key={item.id}
          className="border p-4 rounded mb-4"
        >
          <input
            className="w-full border p-2 mb-2 rounded"
            value={item.name}
            onChange={(e) => {
              const updated =
                [...topnotchers];

              updated[index].name =
                e.target.value;

              setTopnotchers(updated);
            }}
          />

          <input
            className="w-full border p-2 mb-2 rounded"
            value={item.rank}
            onChange={(e) => {
              const updated =
                [...topnotchers];

              updated[index].rank =
                e.target.value;

              setTopnotchers(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded"
            value={item.year}
            onChange={(e) => {
              const updated =
                [...topnotchers];

              updated[index].year =
                e.target.value;

              setTopnotchers(updated);
            }}
          />
        </div>
      ))}
    </div>
  );
}