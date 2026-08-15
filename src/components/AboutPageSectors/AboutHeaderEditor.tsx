interface Props {
  content:any;
  updateField:any;
}

export default function AboutHeaderEditor({
  content,
  updateField
}: Props) {
  return (
    <div className="bg-white p-6 rounded-xl mb-6">

      <h2 className="font-bold text-xl mb-4">
        About Header
      </h2>

      <input
        value={content.header?.title || ''}
        onChange={(e)=>
          updateField(
            'header',
            'title',
            e.target.value
          )
        }
        className="w-full border p-3 rounded"
      />

      <textarea
        value={content.header?.description || ''}
        onChange={(e)=>
          updateField(
            'header',
            'description',
            e.target.value
          )
        }
        className="w-full border p-3 rounded mt-3"
      />

    </div>
  );
}