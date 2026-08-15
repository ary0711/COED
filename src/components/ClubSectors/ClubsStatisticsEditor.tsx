interface ClubStatistic {
  id: string;
  label: string;
  value: string;
  display_order: number;
}

interface Props {
  statistics: ClubStatistic[];
  setStatistics: React.Dispatch<
    React.SetStateAction<ClubStatistic[]>
  >;
}

export function ClubsStatisticsEditor({
  statistics,
  setStatistics,
}: Props) {
  function updateStatistic(
    index: number,
    field: string,
    value: string
  ) {
    const updated = [...statistics];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setStatistics(updated);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Statistics
      </h2>

      {statistics.map((stat, index) => (
        <div
          key={stat.id}
          className="border rounded p-4 mb-4"
        >
          <input
            className="w-full border p-2 rounded mb-2"
            value={stat.label}
            onChange={(e) =>
              updateStatistic(
                index,
                'label',
                e.target.value
              )
            }
          />

          <input
            className="w-full border p-2 rounded"
            value={stat.value}
            onChange={(e) =>
              updateStatistic(
                index,
                'value',
                e.target.value
              )
            }
          />
        </div>
      ))}
    </div>
  );
}