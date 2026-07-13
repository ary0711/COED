interface Props {
  content: any;
  setContent: React.Dispatch<any>;
}

export function AchievementsPageContentEditor({
  content,
  setContent,
}: Props) {
  if (!content) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        Page Content
      </h2>

      <div className="space-y-4">

        <input
          className="w-full border p-3 rounded"
          value={content.page_title || ''}
          onChange={(e) =>
            setContent({
              ...content,
              page_title: e.target.value,
            })
          }
          placeholder="Page Title"
        />

        <textarea
          className="w-full border p-3 rounded"
          value={content.page_subtitle || ''}
          onChange={(e) =>
            setContent({
              ...content,
              page_subtitle: e.target.value,
            })
          }
          placeholder="Page Subtitle"
        />

        <input
          className="w-full border p-3 rounded"
          value={content.topnotchers_title || ''}
          onChange={(e) =>
            setContent({
              ...content,
              topnotchers_title:
                e.target.value,
            })
          }
        />

        <input
          className="w-full border p-3 rounded"
          value={
            content.topnotchers_filter_label ||
            ''
          }
          onChange={(e) =>
            setContent({
              ...content,
              topnotchers_filter_label:
                e.target.value,
            })
          }
        />

        <input
          className="w-full border p-3 rounded"
          value={
            content.college_achievements_title ||
            ''
          }
          onChange={(e) =>
            setContent({
              ...content,
              college_achievements_title:
                e.target.value,
            })
          }
        />

        <input
          className="w-full border p-3 rounded"
          value={content.button_text || ''}
          onChange={(e) =>
            setContent({
              ...content,
              button_text:
                e.target.value,
            })
          }
        />

      </div>
    </div>
  );
}