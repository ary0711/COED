interface Props {
  achievements: any[];
  setAchievements: React.Dispatch<any>;
}

export function AchievementsCollegeEditor({
  achievements,
  setAchievements,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        College Achievements
      </h2>

      {achievements.map(
        (item, index) => (
          <div
            key={item.id}
            className="border p-4 rounded mb-4"
          >
            <input
              className="w-full border p-2 mb-2 rounded"
              value={item.title}
              onChange={(e) => {
                const updated =
                  [...achievements];

                updated[index].title =
                  e.target.value;

                setAchievements(
                  updated
                );
              }}
            />

            <textarea
              className="w-full border p-2 rounded"
              value={
                item.description
              }
              onChange={(e) => {
                const updated =
                  [...achievements];

                updated[
                  index
                ].description =
                  e.target.value;

                setAchievements(
                  updated
                );
              }}
            />
          </div>
        )
      )}
    </div>
  );
}