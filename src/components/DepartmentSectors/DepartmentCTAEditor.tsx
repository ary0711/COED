interface Props {
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

export function DepartmentCTAEditor({
  content,
  updateField,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        CTA Section
      </h2>

      <input
        type="text"
        value={content.cta?.title || ''}
        onChange={(e) =>
          updateField(
            'cta',
            'title',
            e.target.value
          )
        }
        placeholder="CTA Title"
        className="w-full border p-3 rounded-lg mb-4"
      />

      <textarea
        value={
          content.cta?.description || ''
        }
        onChange={(e) =>
          updateField(
            'cta',
            'description',
            e.target.value
          )
        }
        rows={4}
        placeholder="CTA Description"
        className="w-full border p-3 rounded-lg mb-4"
      />

      <input
        type="text"
        value={content.cta?.content || ''}
        onChange={(e) =>
          updateField(
            'cta',
            'content',
            e.target.value
          )
        }
        placeholder="Button Text"
        className="w-full border p-3 rounded-lg"
      />
    </div>
  );
}