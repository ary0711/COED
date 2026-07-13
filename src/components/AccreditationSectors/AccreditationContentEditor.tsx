interface Props {
  content: any;
  setContent: (value: any) => void;
}

export function AccreditationContentEditor({
  content,
  setContent,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Page Content
      </h2>

      <input
        value={content?.page_title || ''}
        onChange={(e) =>
          setContent({
            ...content,
            page_title: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3 mb-4"
        placeholder="Page Title"
      />

      <textarea
        rows={10}
        value={content?.about_content || ''}
        onChange={(e) =>
          setContent({
            ...content,
            about_content: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      />

    </div>
  );
}