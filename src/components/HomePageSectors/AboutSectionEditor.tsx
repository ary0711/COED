interface Props {
  content: any;
  updateField: any;
}

export function AboutSectionEditor({
  content,
  updateField,
}: Props) {
  const about = content['About Section'] || {};

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        About Section
      </h2>

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Badge Text"
        value={about.badge_text || ''}
        onChange={(e) =>
          updateField(
            'About Section',
            'badge_text',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Heading"
        value={about.heading || ''}
        onChange={(e) =>
          updateField(
            'About Section',
            'heading',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Highlight Text"
        value={about.highlight_text || ''}
        onChange={(e) =>
          updateField(
            'About Section',
            'highlight_text',
            e.target.value
          )
        }
      />

      <textarea
        className="w-full border p-3 rounded"
        rows={5}
        placeholder="Description"
        value={about.description || ''}
        onChange={(e) =>
          updateField(
            'About Section',
            'description',
            e.target.value
          )
        }
      />
    </div>
  );
}