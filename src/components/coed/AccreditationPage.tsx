import { Award, CheckCircle, FileText, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { accreditationService } from '../../landing-page/services/accreditationService';
interface AccreditationProgram {
  id: string;
  name: string;
  level: string;
  status: string;
  accreditor: string;
  cmoReference: string;
}

interface Certification {
  id: string;
  title: string;
  description: string;
  year: string;
}

interface AccreditationLevel {
  id: string;
  level_name: string;
  description: string;
  color: string;
}

interface AccreditationOverview {
  id: string;
  title: string;
  value: string;
  description: string;
}

interface AccreditationPageContent {
  id: string;
  page_title: string;
  page_subtitle: string;
  about_title: string;
  about_content: string;
  levels_title: string;
  programs_title: string;
  certifications_title: string;
}
interface AccreditationPageProps {
  previewMode?: boolean;
  previewContent?: any;
  previewOverview?: any[];
  previewLevels?: any[];
  previewPrograms?: any[];
  previewCertifications?: any[];
}
export function AccreditationPage({
  previewMode = false,
  previewContent,
  previewOverview,
  previewLevels,
  previewPrograms,
  previewCertifications,
}: AccreditationPageProps) {
  const [programs, setPrograms] =
  useState<AccreditationProgram[]>([]);
const [loading, setLoading] = useState(true);
const [certifications, setCertifications] =
  useState<Certification[]>([]);

const [levels, setLevels] =
  useState<AccreditationLevel[]>([]);

const [overview, setOverview] =
  useState<AccreditationOverview[]>([]);

const [pageContent, setPageContent] =
  useState<AccreditationPageContent | null>(null);
useEffect(() => {
  if (previewMode) {
    setLoading(false);
    return;
  }

  loadAccreditationPage();
}, []);
const displayContent =
  previewMode
    ? previewContent
    : pageContent;

const displayOverview =
  previewMode
    ? previewOverview || []
    : overview;

const displayLevels =
  previewMode
    ? previewLevels || []
    : levels;

const displayPrograms =
  previewMode
    ? previewPrograms || []
    : programs;

const displayCertifications =
  previewMode
    ? previewCertifications || []
    : certifications;


 async function loadAccreditationPage() {
  try {
    const [
      content,
      overviewData,
      levelData,
      programData,
      certificationData
    ] = await Promise.all([
      accreditationService.getPageContent(),
      accreditationService.getOverview(),
      accreditationService.getLevels(),
      accreditationService.getPrograms(),
      accreditationService.getCertifications(),
    ]);

    setPageContent(content);
    setOverview(overviewData || []);
    setLevels(levelData || []);
    setPrograms(programData || []);
    setCertifications(certificationData || []);

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}
 const getLevelColor = (level: string) => {
    switch (level) {
      case 'Level IV':
        return 'bg-purple-100 text-purple-700 border-purple-500';
      case 'Level III':
        return 'bg-green-100 text-green-700 border-green-500';
      case 'Level II':
        return 'bg-blue-100 text-blue-700 border-blue-500';
      case 'Level I':
        return 'bg-yellow-100 text-yellow-700 border-yellow-500';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  };
const badgeColors: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
};
const cardColors: Record<string, string> = {
  yellow: 'border-yellow-500 bg-yellow-50',
  blue: 'border-blue-500 bg-blue-50',
  green: 'border-green-500 bg-green-50',
  purple: 'border-purple-500 bg-purple-50',
};
if (!previewMode && loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4"></div>

        <h2 className="text-xl font-semibold text-[#1E3A8A]">
          Loading Accreditation...
        </h2>

        <p className="text-gray-500 mt-2">
          Please wait while we load the page.
        </p>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-white  py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4"> {displayContent?.page_title}</h1>
          <p className="text-xl text-gray-600">
           {displayContent?.page_subtitle}
          </p>
        </div>

        {/* Overview */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 mb-12 text-white">
          <div className="grid md:grid-cols-3 gap-8">
  {displayOverview?.map((item, index) => {

    const icons = [
      <Award
        key="award"
        className="w-12 h-12 mx-auto mb-3 opacity-90"
      />,
      <CheckCircle
        key="check"
        className="w-12 h-12 mx-auto mb-3 opacity-90"
      />,
      <FileText
        key="file"
        className="w-12 h-12 mx-auto mb-3 opacity-90"
      />,
    ];

    return (
      <div
        key={item.id}
        className="text-center"
      >
        {icons[index]}

        <div className="text-3xl font-bold mb-2">
          {item.value}
        </div>

        <div className="text-blue-100">
          {item.title}
        </div>
      </div>
    );
  })}
</div>
        </div>

        {/* What is Accreditation */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
             {displayContent?.about_title}
          </h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
            <p className="whitespace-pre-line">
  {displayContent?.about_content}
</p>
          </div>
        </div>

        {/* Accreditation Levels */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
           {displayContent?.levels_title}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">

  {displayLevels?.map((level) => (

    <div
  key={level.id}
  className={`border-2 rounded-lg p-6 ${
    cardColors[level.color] || ''
  }`}
>

      <div className="text-center mb-4">

        <div
  className={`inline-block px-4 py-2 rounded-full font-semibold ${
    badgeColors[level.color]
  }`}
>
  {level.level_name}
</div>
      </div>

      <p className="text-sm text-gray-700 text-center">
        {level.description}
      </p>

    </div>

  ))}

</div>
        </div>

        {/* Program Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
          {displayContent?.programs_title}
          </h2>
          <div className="grid gap-4">
            {displayPrograms?.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {program.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{program.status}</span>
                      <span className="text-gray-400">•</span>
                      <span>Accredited by {program.accreditor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">CMO Reference</div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Calendar className="w-4 h-4" />
                        {program.cmoReference}
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg border-2 font-semibold ${getLevelColor(
                        program.level
                      )}`}
                    >
                      {program.level}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Other Certifications */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
      {displayContent?.certifications_title}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {displayCertifications?.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {cert.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{cert.description}</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full text-sm font-medium">
                  {cert.year}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}