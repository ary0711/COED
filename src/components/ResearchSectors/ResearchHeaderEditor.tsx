interface Props {
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

export function ResearchHeaderEditor({
  content,
  updateField,
}: Props) {
  const header = content.header || {};

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Research Page Header
      </h2>

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Page Title"
        value={header.title || ''}
        onChange={(e) =>
          updateField(
            'header',
            'title',
            e.target.value
          )
        }
      />

      <textarea
        className="w-full border p-3 rounded"
        rows={4}
        placeholder="Page Description"
        value={header.description || ''}
        onChange={(e) =>
          updateField(
            'header',
            'description',
            e.target.value
          )
        }
      />
    </div>
  );
}