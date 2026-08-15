interface Props {
  content: any;
  setContent: (data:any) => void;
}

export function FooterContentEditor({
  content,
  setContent,
}: Props) {

  return (

    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Footer Content
      </h2>

      <input
        value={content.about_title || ''}
        onChange={(e)=>
          setContent({
            ...content,
            about_title:e.target.value
          })
        }
        placeholder="About Title"
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={content.about_description || ''}
        onChange={(e)=>
          setContent({
            ...content,
            about_description:e.target.value
          })
        }
        placeholder="About Description"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.contact_title || ''}
        onChange={(e)=>
          setContent({
            ...content,
            contact_title:e.target.value
          })
        }
        placeholder="Contact Title"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.address || ''}
        onChange={(e)=>
          setContent({
            ...content,
            address:e.target.value
          })
        }
        placeholder="Address"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.phone || ''}
        onChange={(e)=>
          setContent({
            ...content,
            phone:e.target.value
          })
        }
        placeholder="Phone"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.email || ''}
        onChange={(e)=>
          setContent({
            ...content,
            email:e.target.value
          })
        }
        placeholder="Email"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.social_title || ''}
        onChange={(e)=>
          setContent({
            ...content,
            social_title:e.target.value
          })
        }
        placeholder="Social Title"
        className="w-full border p-2 mb-3"
      />

      <input
        value={content.copyright_text || ''}
        onChange={(e)=>
          setContent({
            ...content,
            copyright_text:e.target.value
          })
        }
        placeholder="Copyright"
        className="w-full border p-2"
      />

    </div>
  );
}