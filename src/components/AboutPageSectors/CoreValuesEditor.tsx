interface CoreValue {
  id: string;
  letter: string;
  word: string;
  description: string;
  display_order: number;
}

interface Props {
  values: CoreValue[];
  setValues: React.Dispatch<
    React.SetStateAction<CoreValue[]>
  >;
}

export default function CoreValuesEditor({
  values,
  setValues,
}: Props) {

  function updateValue(
    index: number,
    field: keyof CoreValue,
    value: string
  ) {
    const updated = [...values];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setValues(updated);
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border p-8 mb-8">

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          University Core Values
        </h2>

        <p className="text-gray-500 mt-2">
          Manage the PREMIER Core Values.
        </p>
      </div>

      <div className="space-y-5">

        {values.map((value, index) => (

          <div
            key={value.id}
            className="border rounded-xl p-5 bg-gray-50"
          >

            <div className="grid md:grid-cols-3 gap-4">

              <div>
                <label className="font-medium text-sm">
                  Letter
                </label>

                <input
                  value={value.letter}
                  onChange={(e) =>
                    updateValue(
                      index,
                      'letter',
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                />
              </div>

              <div>
                <label className="font-medium text-sm">
                  Word
                </label>

                <input
                  value={value.word}
                  onChange={(e) =>
                    updateValue(
                      index,
                      'word',
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                />
              </div>

              <div>
                <label className="font-medium text-sm">
                  Display Order
                </label>

                <input
                  type="number"
                  value={value.display_order}
                  onChange={(e) =>
                    updateValue(
                      index,
                      'display_order',
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                />
              </div>

            </div>

            <div className="mt-4">

              <label className="font-medium text-sm">
                Description
              </label>

              <textarea
                rows={3}
                value={value.description}
                onChange={(e) =>
                  updateValue(
                    index,
                    'description',
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3 mt-1"
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}