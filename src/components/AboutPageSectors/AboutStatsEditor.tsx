import { Plus, Trash2, Users } from 'lucide-react';

interface AboutStat {
  id: string;
  label: string;
  count: string;
  display_order: number;
}

interface Props {
  stats: AboutStat[];
  setStats: React.Dispatch<
    React.SetStateAction<AboutStat[]>
  >;
}

export default function AboutStatsEditor({
  stats,
  setStats,
}: Props) {
  const updateStat = (
    index: number,
    field: keyof AboutStat,
    value: string
  ) => {
    const updated = [...stats];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setStats(updated);
  };

  const addStat = () => {
    setStats([
      ...stats,
      {
        id: crypto.randomUUID(),
        label: '',
        count: '',
        display_order: stats.length + 1,
      },
    ]);
  };

  const deleteStat = (index: number) => {
    setStats(
      stats.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border p-8 mb-8">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            About Statistics
          </h2>

          <p className="text-gray-500 mt-2">
            Manage the statistics displayed
            below the About Page.
          </p>
        </div>

        <button
          onClick={addStat}
          className="
            flex items-center gap-2
            bg-blue-600
            text-white
            px-5 py-3
            rounded-xl
          "
        >
          <Plus size={18} />
          Add Statistic
        </button>
      </div>

      {/* Live Preview */}

      <div className="grid md:grid-cols-4 gap-5 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="
              bg-blue-50
              rounded-2xl
              p-8
              text-center
              border
            "
          >
            <Users
              size={28}
              className="mx-auto text-blue-600 mb-4"
            />

            <h3 className="text-4xl font-bold text-blue-900">
              {stat.count || '0'}
            </h3>

            <p className="text-gray-600 mt-2">
              {stat.label || 'Label'}
            </p>
          </div>
        ))}
      </div>

      {/* Edit Form */}

      <div className="space-y-6">
        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className="
              border
              rounded-xl
              p-5
              bg-gray-50
            "
          >
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">
                Statistic #{index + 1}
              </h3>

              <button
                onClick={() =>
                  deleteStat(index)
                }
                className="text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                type="text"
                placeholder="Count"
                value={stat.count}
                onChange={(e) =>
                  updateStat(
                    index,
                    'count',
                    e.target.value
                  )
                }
                className="
                  border
                  rounded-lg
                  p-3
                "
              />

              <input
                type="text"
                placeholder="Label"
                value={stat.label}
                onChange={(e) =>
                  updateStat(
                    index,
                    'label',
                    e.target.value
                  )
                }
                className="
                  border
                  rounded-lg
                  p-3
                "
              />

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}