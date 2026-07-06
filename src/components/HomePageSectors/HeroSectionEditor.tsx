interface Props {
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

export function HeroSectionEditor({
  content,
  updateField,
}: Props) {
  const hero = content['Hero Section'] || {};

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Hero Section
      </h2>

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Badge Text"
        value={hero.badge_text || ''}
        onChange={(e) =>
          updateField(
            'Hero Section',
            'badge_text',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Title"
        value={hero.title || ''}
        onChange={(e) =>
          updateField(
            'Hero Section',
            'title',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Highlight Text"
        value={hero.highlight_text || ''}
        onChange={(e) =>
          updateField(
            'Hero Section',
            'highlight_text',
            e.target.value
          )
        }
      />

      <textarea
        className="w-full border p-3 rounded mb-3"
        placeholder="Subtitle"
        value={hero.subtitle || ''}
        onChange={(e) =>
          updateField(
            'Hero Section',
            'subtitle',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded mb-3"
        placeholder="Button Text"
        value={hero.button_text || ''}
        onChange={(e) =>
          updateField(
            'Hero Section',
            'button_text',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-3 rounded"
        placeholder="Image URL"
        value={hero.image_url || ''}
        onChange={(e) =>
          updateField(
            'Hero Section',
            'image_url',
            e.target.value
          )
        }
      />
    </div>
  );
}