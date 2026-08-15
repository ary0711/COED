interface Props {
  features: any[];
  setFeatures: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}

export function FeaturesEditor({
  features,
  setFeatures,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Features
      </h2>

      {features.map((feature, index) => (
        <div
          key={feature.id}
          className="border rounded p-4 mb-4"
        >
          <input
            className="w-full border p-2 rounded mb-2"
            value={feature.title}
            placeholder="Title"
            onChange={(e) => {
              const updated = [...features];
              updated[index].title =
                e.target.value;
              setFeatures(updated);
            }}
          />

          <textarea
            className="w-full border p-2 rounded mb-2"
            value={feature.description}
            placeholder="Description"
            onChange={(e) => {
              const updated = [...features];
              updated[index].description =
                e.target.value;
              setFeatures(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded"
            value={feature.icon}
            placeholder="Icon"
            onChange={(e) => {
              const updated = [...features];
              updated[index].icon =
                e.target.value;
              setFeatures(updated);
            }}
          />
        </div>
      ))}
    </div>
  );
}