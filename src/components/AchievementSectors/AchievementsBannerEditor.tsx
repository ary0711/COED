interface Props {
  banner: any;
  setBanner: React.Dispatch<any>;
}

export function AchievementsBannerEditor({
  banner,
  setBanner,
}: Props) {
  if (!banner) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">

      <h2 className="text-xl font-bold mb-4">
        Banner
      </h2>

      <input
        className="w-full border p-3 rounded mb-4"
        value={banner.title || ''}
        onChange={(e) =>
          setBanner({
            ...banner,
            title: e.target.value,
          })
        }
      />

      <textarea
        className="w-full border p-3 rounded"
        value={banner.description || ''}
        onChange={(e) =>
          setBanner({
            ...banner,
            description:
              e.target.value,
          })
        }
      />
    </div>
  );
}