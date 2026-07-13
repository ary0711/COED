interface Props {
  links:any[];
  setLinks:(links:any[])=>void;
}

export function FooterQuickLinksEditor({
  links,
  setLinks,
}:Props){

  const updateLink = (
    id:string,
    field:string,
    value:string
  ) => {

    setLinks(
      links.map(link =>
        link.id === id
          ? {
              ...link,
              [field]:value
            }
          : link
      )
    );
  };

  return (

    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Quick Links
      </h2>

      {links.map(link => (

        <div
          key={link.id}
          className="border p-3 rounded mb-3"
        >

          <input
            value={link.label}
            onChange={(e)=>
              updateLink(
                link.id,
                'label',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
          />

        </div>

      ))}

    </div>
  );
}