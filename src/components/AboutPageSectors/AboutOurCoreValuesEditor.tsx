import { Plus, Trash2 } from 'lucide-react';

interface CoreValueCard {
  id: string;
  value_name: string;
  display_order: number;
}

interface Props {
  values: CoreValueCard[];
  setValues: React.Dispatch<
    React.SetStateAction<CoreValueCard[]>
  >;
}

export default function AboutOurCoreValuesEditor({
  values,
  setValues,
}: Props) {

  const updateValue = (
    index: number,
    value: string
  ) => {
    const updated = [...values];

    updated[index] = {
      ...updated[index],
      value_name: value,
    };

    setValues(updated);
  };

  const addValue = () => {
    setValues([
      ...values,
      {
        id: crypto.randomUUID(),
        value_name: '',
        display_order: values.length + 1,
      },
    ]);
  };

  const deleteValue = (index: number) => {
    setValues(
      values.filter(
        (_, i) => i !== index
      )
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border p-8 mb-8">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            About Page Core Values
          </h2>

          <p className="text-gray-500 mt-2">
            Manage the values displayed in the
            blue Core Values section.
          </p>
        </div>

        <button
          onClick={addValue}
          className="
            flex items-center gap-2
            bg-blue-600
            text-white
            px-5 py-3
            rounded-xl
          "
        >
          <Plus size={18} />
          Add Value
        </button>
      </div>

      {/* Preview */}

      <div className="bg-[#1E3A8A] rounded-2xl p-8 text-white mb-10">

        <h3 className="text-2xl font-semibold text-center mb-8">
          Our Core Values
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

          {values.map((value) => (
            <div
              key={value.id}
              className="
                bg-white/10
                hover:bg-white/20
                transition-colors
                rounded-xl
                p-5
                text-center
              "
            >
              <span className="font-medium text-lg">
                {value.value_name ||
                  'Core Value'}
              </span>
            </div>
          ))}

        </div>

      </div>

      {/* Editor */}

      <div className="space-y-5">

        {values.map((value, index) => (
          <div
            key={value.id}
            className="
              border
              rounded-xl
              p-5
              bg-gray-50
            "
          >

            <div className="flex justify-between items-center mb-4">

              <h3 className="font-semibold">
                Core Value #{index + 1}
              </h3>

              <button
                onClick={() =>
                  deleteValue(index)
                }
                className="text-red-600"
              >
                <Trash2 size={18} />
              </button>

            </div>

            <input
              type="text"
              value={value.value_name}
              onChange={(e) =>
                updateValue(
                  index,
                  e.target.value
                )
              }
              placeholder="Excellence"
              className="
                w-full
                border
                rounded-lg
                p-3
              "
            />

          </div>
        ))}

      </div>

    </div>
  );
}