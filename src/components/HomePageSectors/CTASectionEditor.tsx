interface Props {
  content: any;
  updateField: any;
}

export function CTASectionEditor({
  content,
  updateField,
}: Props) {
  const cta = content['CTA Section'] || {};

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        CTA Section
      </h2>

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Badge Text"
        value={cta.badge_text || ''}
        onChange={(e) =>
          updateField(
            'CTA Section',
            'badge_text',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Title"
        value={cta.title || ''}
        onChange={(e) =>
          updateField(
            'CTA Section',
            'title',
            e.target.value
          )
        }
      />

      <textarea
        className="w-full border p-3 rounded mb-3"
        rows={4}
        placeholder="Description"
        value={cta.description || ''}
        onChange={(e) =>
          updateField(
            'CTA Section',
            'description',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded"
        placeholder="Button Text"
        value={cta.button_text || ''}
        onChange={(e) =>
          updateField(
            'CTA Section',
            'button_text',
            e.target.value
          )
        }
      />
    </div>
  );
}