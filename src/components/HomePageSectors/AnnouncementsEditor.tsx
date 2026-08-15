interface Props {
   announcements: any[];
  setAnnouncements: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}


export function AnnouncementsEditor({
  announcements,
  setAnnouncements,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Announcements
      </h2>

      {announcements.map(
        (announcement, index) => (
          <div
            key={announcement.id}
            className="border rounded p-4 mb-4"
          >
            <input
              className="w-full border p-2 rounded mb-2"
              value={announcement.title}
              placeholder="Title"
              onChange={(e) => {
                const updated = [
                  ...announcements,
                ];

                updated[index].title =
                  e.target.value;

                setAnnouncements(updated);
              }}
            />

            <textarea
              className="w-full border p-2 rounded mb-2"
              value={
                announcement.description
              }
              placeholder="Description"
              onChange={(e) => {
                const updated = [
                  ...announcements,
                ];

                updated[index].description =
                  e.target.value;

                setAnnouncements(updated);
              }}
            />

            <input
              className="w-full border p-2 rounded"
              value={announcement.color}
              placeholder="Color"
              onChange={(e) => {
                const updated = [
                  ...announcements,
                ];

                updated[index].color =
                  e.target.value;

                setAnnouncements(updated);
              }}
            />
          </div>
        )
      )}
    </div>
  );
}