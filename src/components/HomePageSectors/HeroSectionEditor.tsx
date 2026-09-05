import { useState } from 'react';
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

  // ============================================
  // MODAL STATE
  // ============================================
  const [modal, setModal] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  // ============================================
  // SHOW MODAL
  // ============================================
  function showModal(
    type: 'success' | 'error',
    title: string,
    message: string
  ) {
    setModal({
      show: true,
      type,
      title,
      message,
    });
  }

  // ============================================
  // CLOSE MODAL
  // ============================================
  function closeModal() {
    setModal((prev) => ({
      ...prev,
      show: false,
    }));
  }

  // ============================================
  // UPLOAD HERO IMAGE
  // ============================================
  async function uploadHeroImage(file: File) {
    try {
      if (!file) return;

      // Check image type
      if (!file.type.startsWith('image/')) {
        showModal(
          'error',
          'Invalid Image',
          'Please select a valid image file.'
        );
        return;
      }

      // Create unique file name
      const fileExt = file.name.split('.').pop();

      const fileName = `hero-${Date.now()}.${fileExt}`;

      const filePath = `hero/${fileName}`;

      // Upload image
      const { error: uploadError } =
        await supabase.storage
          .from('landing-page-images')
          .upload(filePath, file, {
            upsert: true,
          });

      if (uploadError) {
        console.error(
          'Upload error:',
          uploadError
        );

        showModal(
          'error',
          'Upload Failed',
          uploadError.message
        );

        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from('landing-page-images')
        .getPublicUrl(filePath);

      console.log(
        'Uploaded image:',
        publicUrl
      );

      // Update image URL
      updateField(
        'Hero Section',
        'image_url',
        publicUrl
      );

      // Success modal
      showModal(
        'success',
        'Image Uploaded',
        'Hero image uploaded successfully!'
      );

    } catch (error) {
      console.error(
        'Hero image error:',
        error
      );

      showModal(
        'error',
        'Upload Failed',
        'Failed to upload the hero image. Please try again.'
      );
    }
  }

  return (
    <>
      {/* ============================================
          HERO SECTION EDITOR
      ============================================ */}
      <div className="bg-white rounded-xl p-6 shadow mb-6">

        <h2 className="text-xl font-bold mb-4">
          Hero Section
        </h2>

        {/* Badge Text */}
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

        {/* ============================================
            HERO IMAGE
        ============================================ */}
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

          {/* Preview */}
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

      {/* ============================================
          MODAL
      ============================================ */}
      {modal.show && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">

    <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl border border-blue-200">

      {/* Header */}
      <div className="px-6 py-4 border-b border-blue-100">
        <h3 className="text-lg font-semibold text-[#1E3A8A]">
          {modal.title}
        </h3>
      </div>

      {/* Message */}
      <div className="px-6 py-6">
        <p className="text-gray-600 text-sm leading-relaxed">
          {modal.message}
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-blue-50 border-t border-blue-100 flex justify-end">
        <button
          type="button"
          onClick={closeModal}
          className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#2563EB] text-white text-sm font-medium rounded-md transition-colors"
        >
          OK
        </button>
      </div>

    </div>

  </div>
)}
    </>
  );
}