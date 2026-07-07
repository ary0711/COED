interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  members: string;
  motto: string;
  display_order: number;
}

interface Props {
  organizations: Organization[];
  setOrganizations: React.Dispatch<
    React.SetStateAction<Organization[]>
  >;
}

export function OrganizationEditor({
  organizations,
  setOrganizations,
}: Props) {
  function updateOrg(
    index: number,
    field: string,
    value: string
  ) {
    const updated = [...organizations];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setOrganizations(updated);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Organizations
      </h2>

      {organizations.map((org, index) => (
        <div
          key={org.id}
          className="border rounded p-4 mb-4"
        >
          <input
            className="w-full border p-2 rounded mb-2"
            value={org.name}
            placeholder="Name"
            onChange={(e) =>
              updateOrg(
                index,
                'name',
                e.target.value
              )
            }
          />

          <input
            className="w-full border p-2 rounded mb-2"
            value={org.type}
            placeholder="Type"
            onChange={(e) =>
              updateOrg(
                index,
                'type',
                e.target.value
              )
            }
          />

          <textarea
            className="w-full border p-2 rounded mb-2"
            value={org.description}
            rows={4}
            onChange={(e) =>
              updateOrg(
                index,
                'description',
                e.target.value
              )
            }
          />

          <input
            className="w-full border p-2 rounded mb-2"
            value={org.members}
            placeholder="Members"
            onChange={(e) =>
              updateOrg(
                index,
                'members',
                e.target.value
              )
            }
          />

          <input
            className="w-full border p-2 rounded"
            value={org.motto}
            placeholder="Motto"
            onChange={(e) =>
              updateOrg(
                index,
                'motto',
                e.target.value
              )
            }
          />
        </div>
      ))}
    </div>
  );
}