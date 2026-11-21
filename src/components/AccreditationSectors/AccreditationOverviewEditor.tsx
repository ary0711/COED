interface Props {
  overview: any[];
  setOverview: (data: any[]) => void;
}

export function AccreditationOverviewEditor({
  overview,
  setOverview,
}: Props) {

  const updateItem = (
    index: number,
    field: string,
    value: string
  ) => {

    const updated = [...overview];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setOverview(updated);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Overview Cards
      </h2>

      {overview.map((item, index) => (

        <div
          key={item.id}
          className="border rounded-lg p-4 mb-3"
        >

          <input
           value={item.title || ''}
            onChange={(e) =>
              updateItem(
                index,
                'title',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
          />

          <input
           value={item.value || ''}
            onChange={(e) =>
              updateItem(
                index,
                'value',
                e.target.value
              )
            }
            className="w-full border p-2"
          />

        </div>

      ))}

    </div>
  );
}