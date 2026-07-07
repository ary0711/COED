interface ClubsHeaderEditorProps {
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

export function ClubsHeaderEditor({
  content,
  updateField,
}: ClubsHeaderEditorProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Clubs Header
      </h2>

      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="Title"
        value={content.header?.title || ''}
        onChange={(e) =>
          updateField(
            'header',
            'title',
            e.target.value
          )
        }
      />

      <textarea
        className="w-full border p-2 rounded"
        rows={3}
        placeholder="Description"
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
      />
    </div>
  );
}