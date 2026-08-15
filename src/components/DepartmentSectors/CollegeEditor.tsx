
interface Props {
  colleges: any[];
  setColleges: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}

export function CollegeEditor({
  colleges,
  setColleges,
}: Props) {
  const updateCollege = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...colleges];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setColleges(updated);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">

      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">
          Colleges
        </h2>

      

      </div>

      {colleges.map(
        (college, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 mb-4"
          >
            <input
              type="text"
              value={
                college.college_name
              }
              onChange={(e) =>
                updateCollege(
                  index,
                  'college_name',
                  e.target.value
                )
              }
              className="w-full border p-2 rounded mb-3"
            />

            
          </div>
        )
      )}
    </div>
  );
}