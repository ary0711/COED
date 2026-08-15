interface Props {
  levels: any[];
  setLevels: (data: any[]) => void;
}

export function AccreditationLevelsEditor({
  levels,
  setLevels,
}: Props) {

  const updateLevel = (
    index: number,
    field: string,
    value: string
  ) => {

    const updated = [...levels];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setLevels(updated);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Accreditation Levels
      </h2>

      {levels.map((level, index) => (

        <div
          key={level.id}
          className="border rounded-lg p-4 mb-3"
        >

          <input
            value={level.level_name}
            onChange={(e) =>
              updateLevel(
                index,
                'level_name',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
          />

          <textarea
            value={level.description}
            onChange={(e) =>
              updateLevel(
                index,
                'description',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
          />

          <select
            value={level.color}
            onChange={(e) =>
              updateLevel(
                index,
                'color',
                e.target.value
              )
            }
            className="w-full border p-2"
          >
            <option value="yellow">Yellow</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
          </select>

        </div>

      ))}

    </div>
  );
}