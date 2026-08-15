// ContactSocialLinksEditor.tsx

interface Props {
  socialLinks: any[];
  setSocialLinks: (data: any[]) => void;
}

export function ContactSocialLinksEditor({
  socialLinks,
  setSocialLinks,
}: Props) {

  const updateSocial = (
    id: string,
    field: string,
    value: string
  ) => {
    setSocialLinks(
      socialLinks.map((social) =>
        social.id === id
          ? {
              ...social,
              [field]: value,
            }
          : social
      )
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Social Links
      </h2>

      {socialLinks.map((social) => (

        <div
          key={social.id}
          className="border rounded p-3 mb-3"
        >

          <input
            value={social.platform}
            onChange={(e) =>
              updateSocial(
                social.id,
                'platform',
                e.target.value
              )
            }
            placeholder="facebook"
            className="w-full border p-2 mb-2"
          />

          <input
            value={social.url}
            onChange={(e) =>
              updateSocial(
                social.id,
                'url',
                e.target.value
              )
            }
            placeholder="https://..."
            className="w-full border p-2"
          />

        </div>

      ))}
    </div>
  );
}