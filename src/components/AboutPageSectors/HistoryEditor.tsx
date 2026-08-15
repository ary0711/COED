import { uploadAboutImage } from '../../landing-page/services/aboutService';

interface Props {
  content: any;
  updateField: any;
}

export default function HistoryEditor({
  content,
  updateField
}: Props) {

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const imageUrl = await uploadAboutImage(
        file,
        'history'
      );

      updateField(
        'history',
        'image',
        imageUrl
      );
    } catch (error) {
      console.error(error);
      alert('Failed to upload image');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl mb-6">

      <h2 className="font-bold text-xl mb-4">
        History Section
      </h2>

      {/* Title */}
      <input
        value={content.history?.title || ''}
        onChange={(e) =>
          updateField(
            'history',
            'title',
            e.target.value
          )
        }
        className="w-full border rounded p-3 mb-3"
        placeholder="History Title"
      />

      {/* Content */}
      <textarea
        rows={12}
        value={content.history?.content || ''}
        onChange={(e) =>
          updateField(
            'history',
            'content',
            e.target.value
          )
        }
        className="w-full border rounded p-3 mb-4"
      />

      {/* Badge Number */}
      <input
        value={
          content.history?.badge_number || ''
        }
        onChange={(e) =>
          updateField(
            'history',
            'badge_number',
            e.target.value
          )
        }
        className="w-full border rounded p-3 mb-4"
        placeholder="Badge Number (Example: 30+)"
      />

      {/* Image Upload */}
      <div className="mb-4">
        <label className="block font-medium mb-2">
          History Image
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      {/* Preview */}
      {content.history?.image && (
        <img
          src={content.history.image}
          alt="History Preview"
          className="w-full max-w-md h-64 object-cover rounded-lg border"
        />
      )}
    </div>
  );
}