interface Props {
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

export function DepartmentHeaderEditor({
  content,
  updateField,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Department Header
      </h2>

      <input
        type="text"
        value={content.header?.title || ''}
        onChange={(e) =>
          updateField(
            'header',
            'title',
            e.target.value
          )
        }
        placeholder="Title"
        className="w-full border p-3 rounded-lg mb-4"
      />

      <textarea
        value={
          content.header?.description || ''
        }
        onChange={(e) =>
          updateField(
            'header',
            'description',
            e.target.value
          )
        }
        placeholder="Description"
        rows={4}
        className="w-full border p-3 rounded-lg"
      />
    </div>
  );
}