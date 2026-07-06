export default function VisionMissionGoalsEditor({
  content,
  updateField
}: any) {
  const sections = [
    {
      key: 'vision',
      title: 'Vision',
      icon: '👁️',
      color: 'border-blue-500'
    },
    {
      key: 'mission',
      title: 'Mission',
      icon: '🎯',
      color: 'border-green-500'
    },
    {
      key: 'goals',
      title: 'Goals',
      icon: '🏆',
      color: 'border-purple-500'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border p-8 mb-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Vision, Mission & Goals
        </h2>

        <p className="text-gray-500 mt-2">
          Manage the College Vision, Mission, and Goals displayed
          on the About Page.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.key}
            className={`border-l-4 ${section.color} bg-gray-50 rounded-xl p-5`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">
                {section.icon}
              </span>

              <h3 className="text-lg font-semibold text-gray-800">
                {section.title}
              </h3>
            </div>

            <textarea
              rows={6}
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                p-4
                focus:ring-2
                focus:ring-blue-500
                focus:border-blue-500
                outline-none
                resize-none
              "
              placeholder={`Enter ${section.title} statement...`}
              value={
                content?.[section.key]?.description || ''
              }
              onChange={(e) =>
                updateField(
                  section.key,
                  'description',
                  e.target.value
                )
              }
            />

            <div className="mt-2 text-xs text-gray-400 text-right">
              {
                (content?.[section.key]?.description || '')
                  .length
              } characters
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}