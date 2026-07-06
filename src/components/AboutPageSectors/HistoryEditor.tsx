interface Props {
  content:any;
  updateField:any;
}

export default function HistoryEditor({
  content,
  updateField
}: Props) {
  return (
    <div className="bg-white p-6 rounded-xl mb-6">

      <h2 className="font-bold text-xl mb-4">
        History Section
      </h2>

      <input
        value={content.history?.title || ''}
        onChange={(e)=>
          updateField(
            'history',
            'title',
            e.target.value
          )
        }
      />

      <textarea
        rows={12}
        value={content.history?.content || ''}
        onChange={(e)=>
          updateField(
            'history',
            'content',
            e.target.value
          )
        }
        className="w-full border rounded p-3"
      />

    </div>
  );
}