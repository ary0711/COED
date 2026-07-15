import { uploadHomepageImage } from '../../landing-page/services/homepageService';

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
  const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  index: number
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const imageUrl =
      await uploadHomepageImage(
        file,
        'stats'
      );

    const updated = [...stats];

    updated[index] = {
      ...updated[index],
      image_url: imageUrl,
    };

    setStats(updated);
  } catch (error) {
    console.error(error);
    alert('Failed to upload image');
  }
};
  const updateStat = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...stats];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setStats(updated);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Stats
      </h2>

      {stats.map((stat, index) => (
        <div
          key={stat.id}
          className="border rounded p-4 mb-4 space-y-3"
        >
          {/* Value */}
          <input
            className="w-full border p-2 rounded"
            value={stat.value || ''}
            placeholder="Value"
            onChange={(e) =>
              updateStat(
                index,
                'value',
                e.target.value
              )
            }
          />

          {/* Label */}
          <input
            className="w-full border p-2 rounded"
            value={stat.label || ''}
            placeholder="Label"
            onChange={(e) =>
              updateStat(
                index,
                'label',
                e.target.value
              )
            }
          />

          {/* Image URL */}
          <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    handleImageUpload(e, index)
  }
  className="w-full border p-2 rounded"
/>

          {/* Preview */}
          {stat.image_url && (
            <img
              src={stat.image_url}
              alt={stat.label}
              className="w-40 h-28 object-cover rounded border"
            />
          )}
        </div>
      ))}
    </div>
  );
}