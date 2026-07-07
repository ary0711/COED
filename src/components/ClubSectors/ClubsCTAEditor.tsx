interface ClubsCTAEditorProps {
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

export function ClubsCTAEditor({
  content,
  updateField,
}: ClubsCTAEditorProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        CTA Section
      </h2>

      <input
        className="w-full border p-2 rounded mb-3"
        value={content.cta?.title || ''}
        placeholder="CTA Title"
        onChange={(e) =>
          updateField(
            'cta',
            'title',
            e.target.value
          )
        }
      />

      <textarea
        className="w-full border p-2 rounded mb-3"
        rows={4}
        value={
          content.cta?.description || ''
        }
        placeholder="CTA Description"
        onChange={(e) =>
          updateField(
            'cta',
            'description',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-2 rounded"
        value={content.cta?.content || ''}
        placeholder="Button Text"
        onChange={(e) =>
          updateField(
            'cta',
            'content',
            e.target.value
          )
        }
      />
    </div>
  );
}