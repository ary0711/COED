// ContactOfficeHoursEditor.tsx

interface Props {
  officeHours: any[];
  setOfficeHours: (data: any[]) => void;
}

export function ContactOfficeHoursEditor({
  officeHours,
  setOfficeHours,
}: Props) {

  const updateHour = (
    id: string,
    field: string,
    value: string
  ) => {
    setOfficeHours(
      officeHours.map((hour) =>
        hour.id === id
          ? {
              ...hour,
              [field]: value,
            }
          : hour
      )
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Office Hours
      </h2>

      {officeHours.map((hour) => (

        <div
          key={hour.id}
          className="border rounded p-3 mb-3"
        >

          <input
            value={hour.day_name}
            onChange={(e) =>
              updateHour(
                hour.id,
                'day_name',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
          />

          <input
            value={hour.hours}
            onChange={(e) =>
              updateHour(
                hour.id,
                'hours',
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