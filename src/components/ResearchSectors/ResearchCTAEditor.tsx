interface Props {
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

export function ResearchCTAEditor({
  content,
  updateField,
}: Props) {

  const cta = content.cta || {};

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        Research CTA Section
      </h2>

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="CTA Title"
        value={cta.title || ''}
        onChange={(e) =>
          updateField(
            'cta',
            'title',
            e.target.value
          )
        }
      />

      <textarea
        className="w-full border p-3 rounded mb-3"
        rows={4}
        placeholder="CTA Description"
        value={cta.description || ''}
        onChange={(e) =>
          updateField(
            'cta',
            'description',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded"
        placeholder="Button Text"
        value={cta.content || ''}
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