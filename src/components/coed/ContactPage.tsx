import { useState , useEffect} from 'react';
import { supabase } from '../../supabaseClient';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Globe,
  Facebook,
  Twitter,
  Clock,
} from 'lucide-react';
interface ContactPageContent {
  id: string;

  page_title: string;
  page_subtitle: string;

  address_title: string;
  address_content: string;

  phone_title: string;
  phone_content: string;

  email_title: string;
  email_content: string;

  office_hours_title: string;

  social_title: string;

  form_title: string;

  map_embed_url: string;
}

interface OfficeHour {
  id: string;
  day_name: string;
  hours: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}
interface ContactPageProps {
  previewMode?: boolean;

  previewContent?: any;

  previewOfficeHours?: any[];

  previewSocialLinks?: any[];
}
export function ContactPage({
  previewMode = false,
  previewContent,
  previewOfficeHours,
  previewSocialLinks,
}: ContactPageProps) {
  const [loading, setLoading] =
  useState(true);
  const [content, setContent] =
  useState<ContactPageContent | null>(null);

  const [officeHours, setOfficeHours] =
  useState<OfficeHour[]>([]);

  const [socialLinks, setSocialLinks] =
  useState<SocialLink[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your inquiry! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };
useEffect(() => {
  if (!previewMode) {
    loadContactPage();
  } else {
    setLoading(false);
  }
}, [previewMode]);

async function loadContactPage() {
  try {
    setLoading(true);

    const [
      contentRes,
      hoursRes,
      socialRes
    ] = await Promise.all([

      supabase
        .from('contact_page_content')
        .select('*')
        .single(),

      supabase
        .from('contact_office_hours')
        .select('*')
        .order('sort_order'),

      supabase
        .from('contact_social_links')
        .select('*')
        .order('sort_order'),
    ]);

    setContent(contentRes.data);

    setOfficeHours(
      hoursRes.data || []
    );

    setSocialLinks(
      socialRes.data || []
    );

  } catch (error) {
    console.error('Failed to load contact page:', error);
  } finally {
    setLoading(false);
  }
}
if (!previewMode && loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4"></div>

        <h2 className="text-xl font-semibold text-[#1E3A8A]">
          Loading Contact...
        </h2>

        <p className="text-gray-500 mt-2">
          Please wait while we load the page.
        </p>
      </div>
    </div>
  );
}
const displayContent =
  previewMode
    ? previewContent
    : content;

const displayOfficeHours =
  previewMode
    ? previewOfficeHours || []
    : officeHours;

const displaySocialLinks =
  previewMode
    ? previewSocialLinks || []
    : socialLinks;
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E0ECFF] via-[#F1F5F9] to-[#DBEAFE] pt-20 pb-12">

      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
           {displayContent.page_title}
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            {displayContent?.page_subtitle}
              </p>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">

          {/* LEFT SIDE */}
          <div className="space-y-10">

            {/* Contact Info */}
            <div className="space-y-8">

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <MapPin className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A8A]">{content?.address_title}</h3>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
  {displayContent?.address_content}
</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <Phone className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A8A]">{content?.phone_title}</h3>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
  {displayContent?.phone_content}
</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <Mail className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A8A]">{displayContent?.email_title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    <div className="whitespace-pre-line">
  {displayContent?.email_content}
</div>
                  </p>
                </div>
              </div>

            </div>

            {/* Office Hours */}
            <div>
              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2563EB]" />
               {displayContent?.office_hours_title}
              </h3>

              <div className="space-y-2 text-sm text-gray-700">
                {displayOfficeHours.map((hour) => (

  <div
    key={hour.id}
    className="flex justify-between"
  >

    <span>
      {hour.day_name}
    </span>

    <span className="font-medium">
      {hour.hours}
    </span>

  </div>

))}
              </div>
            </div>

            {/* Socials */}
            <div>
              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">
                 {displayContent?.social_title}
              </h3>
              <div className="flex gap-4">
                {displaySocialLinks.map((social) => (

  <a
    key={social.id}
    href={social.url}
    target="_blank"
    rel="noopener noreferrer"
    className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition shadow-sm"
  >

    {social.platform === 'facebook' && (
      <Facebook className="w-5 h-5 text-[#2563EB]" />
    )}

    {social.platform === 'twitter' && (
      <Twitter className="w-5 h-5 text-[#2563EB]" />
    )}

    {social.platform === 'website' && (
      <Globe className="w-5 h-5 text-[#2563EB]" />
    )}

  </a>

))}
              </div>
            </div>

          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="lg:-mt-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-10">

              <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
             {displayContent?.form_title}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">

                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none transition"
                />

                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none transition"
                />

                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none transition"
                />

                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Write your message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none resize-none transition"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-5 h-5" />
                  Submit
                </button>

              </form>
            </div>
          </div>

        </div>

        {/* Interactive Map */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-96">
           
  {displayContent?.map_embed_url ? (
    <iframe
      title="Google Map"
      
      src={displayContent.map_embed_url}
      className="w-full h-full border-0"
      allowFullScreen
      loading="lazy"
    />
  ) : (
    <div className="h-full flex items-center justify-center text-gray-500">
      No map configured.
    </div>
  )}
</div>
        </div>

      </div>
    </div>
  );
}
