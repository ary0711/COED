interface Props {
  certifications: any[];
  setCertifications: (data: any[]) => void;
}

export function AccreditationCertificationsEditor({
  certifications,
  setCertifications,
}: Props) {

  const updateCertification = (
    id: string,
    field: string,
    value: string
  ) => {
    setCertifications(
      certifications.map(cert =>
        cert.id === id
          ? {
              ...cert,
              [field]: value,
            }
          : cert
      )
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Certifications
      </h2>

      {certifications.map((cert) => (

        <div
          key={cert.id}
          className="border rounded-lg p-4 mb-3"
        >

          <input
            value={cert.title || ''}
            onChange={(e) =>
              updateCertification(
                cert.id,
                'title',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
            placeholder="Title"
          />

          <textarea
            value={cert.description || ''}
            onChange={(e) =>
              updateCertification(
                cert.id,
                'description',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
            placeholder="Description"
          />

          <input
            value={cert.year || ''}
            onChange={(e) =>
              updateCertification(
                cert.id,
                'year',
                e.target.value
              )
            }
            className="w-full border p-2"
            placeholder="Year"
          />

        </div>

      ))}

    </div>
  );
}