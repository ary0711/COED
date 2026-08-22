import { supabase } from '../../supabaseClient';

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

  async function uploadHeroImage(
    file: File
  ) {
    try {
      const fileExt =
        file.name.split('.').pop();

      const fileName =
        `hero-${Date.now()}.${fileExt}`;

      const filePath =
        `hero/${fileName}`;

      const { error } =
        await supabase.storage
          .from('landing-page')
          .upload(filePath, file);

      if (error) {
        alert(error.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('landing-page')
        .getPublicUrl(filePath);

      updateField(
        'Hero Section',
        'image_url',
        publicUrl
      );

      alert('Image uploaded successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to upload image');
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        Hero Section
      </h2>

      {/* Badge Text */}
      <input
        className="w-full border p-3 rounded mb-3,"
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

      {/* Title */}
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

      {/* Highlight Text */}
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

      {/* Subtitle */}
      <textarea
        className="w-full border p-3 rounded mb-3"
        placeholder="Subtitle"
        rows={4}
        value={hero.subtitle || ''}
        onChange={(e) =>
          updateField(
            'Hero Section',
            'subtitle',
            e.target.value
          )
        }
      />

      {/* Button Text */}
      <input
        className="w-full border p-3 rounded mb-4"
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

      {/* Image Upload Section */}
      <div className="border rounded-lg p-4 bg-gray-50">

        <h3 className="font-semibold mb-3">
          Hero Image
        </h3>

        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={(e) => {
            const file =
              e.target.files?.[0];

            if (file) {
              uploadHeroImage(file);
            }
          }}
        />

        {hero.image_url && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Current Image Preview
            </p>

            <img
              src={hero.image_url}
              alt="Hero Preview"
              className="w-full max-w-lg rounded-lg border shadow"
            />
          </div>
        )}
      </div>

    </div>
  );
}