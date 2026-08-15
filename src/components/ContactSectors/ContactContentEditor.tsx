// ContactContentEditor.tsx

interface Props {
  content: any;
  setContent: (data: any) => void;
}

export function ContactContentEditor({
  content,
  setContent,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Contact Page Content
      </h2>

      {/* Header */}
      <input
        value={content.page_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            page_title: e.target.value,
          })
        }
        placeholder="Page Title"
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={content.page_subtitle || ''}
        onChange={(e) =>
          setContent({
            ...content,
            page_subtitle: e.target.value,
          })
        }
        placeholder="Page Subtitle"
        className="w-full border p-2 mb-3"
      />

      {/* Address */}
      <input
        value={content.address_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            address_title: e.target.value,
          })
        }
        placeholder="Address Title"
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={content.address_content || ''}
        onChange={(e) =>
          setContent({
            ...content,
            address_content: e.target.value,
          })
        }
        placeholder="Address Content"
        className="w-full border p-2 mb-3"
      />

      {/* Phone */}
      <input
        value={content.phone_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            phone_title: e.target.value,
          })
        }
        placeholder="Phone Title"
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={content.phone_content || ''}
        onChange={(e) =>
          setContent({
            ...content,
            phone_content: e.target.value,
          })
        }
        placeholder="Phone Content"
        className="w-full border p-2 mb-3"
      />

      {/* Email */}
      <input
        value={content.email_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            email_title: e.target.value,
          })
        }
        placeholder="Email Title"
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={content.email_content || ''}
        onChange={(e) =>
          setContent({
            ...content,
            email_content: e.target.value,
          })
        }
        placeholder="Email Content"
        className="w-full border p-2 mb-3"
      />

      {/* Others */}
      <input
        value={content.office_hours_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            office_hours_title: e.target.value,
          })
        }
        placeholder="Office Hours Title"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.social_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            social_title: e.target.value,
          })
        }
        placeholder="Social Title"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.form_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            form_title: e.target.value,
          })
        }
        placeholder="Form Title"
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={content.map_embed_url || ''}
        onChange={(e) =>
          setContent({
            ...content,
            map_embed_url: e.target.value,
          })
        }
        placeholder="Google Map Embed URL"
        className="w-full border p-2"
      />
    </div>
  );
}