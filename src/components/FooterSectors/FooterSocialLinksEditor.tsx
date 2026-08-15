interface Props {
  socials:any[];
  setSocials:(data:any[])=>void;
}

export function FooterSocialLinksEditor({
  socials,
  setSocials,
}:Props){

  const updateSocial = (
    id:string,
    field:string,
    value:string
  ) => {

    setSocials(
      socials.map(social =>
        social.id === id
          ? {
              ...social,
              [field]:value
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

      {socials.map(social => (

        <div
          key={social.id}
          className="border p-3 rounded mb-3"
        >

          <input
            value={social.platform}
            onChange={(e)=>
              updateSocial(
                social.id,
                'platform',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
          />

          <input
            value={social.url}
            onChange={(e)=>
              updateSocial(
                social.id,
                'url',
                e.target.value
              )
            }
            className="w-full border p-2"
          />

        </div>

      ))}

    </div>
  );
}