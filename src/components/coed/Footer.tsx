
import {
  Facebook,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { footerService } from '../../landing-page/services/footerService';

interface FooterProps {
  onNavigate?: (page: string) => void;

  previewMode?: boolean;

  previewContent?: any;

  previewQuickLinks?: any[];

  previewSocialLinks?: any[];
}

export function Footer({
  onNavigate,
  previewMode = false,
  previewContent,
  previewQuickLinks,
}: FooterProps) {
  const [content, setContent] = useState<any>(
    previewContent || null
  );

  const [quickLinks, setQuickLinks] = useState<any[]>(
    previewQuickLinks || []
  );

  useEffect(() => {
    if (!previewMode) {
      loadFooter();
    }
  }, [previewMode]);

  async function loadFooter() {
    const [
      footerContent,
      links,
    ] = await Promise.all([
      footerService.getFooterContent(),
      footerService.getQuickLinks(),
    ]);

    setContent(footerContent);
    setQuickLinks(links);
  }

  return (
    <footer className="bg-[#1E3A8A] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* About */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              {content?.about_title}
            </h3>

            <p className="text-blue-200 text-sm leading-relaxed">
              {content?.about_description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              Quick Links
            </h3>

            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => {
                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });

                      switch (link.label) {
                        case 'About COED':
                          onNavigate?.('about');
                          break;

                        case 'Programs Offered':
                          onNavigate?.('departments');
                          break;

                        case 'Research & Extension':
                          onNavigate?.('research');
                          break;

                        case 'Accreditation':
                          onNavigate?.('accreditation');
                          break;

                        default:
                          break;
                      }
                    }}
                    className="text-blue-200 hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              {content?.contact_title}
            </h3>

            <ul className="space-y-3 text-sm">

              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />

                <span className="text-blue-200">
                  {content?.address}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />

                <span className="text-blue-200">
                  {content?.phone}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />

                <span className="text-blue-200">
                  {content?.email}
                </span>
              </li>

            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              {content?.social_title || 'Follow Us'}
            </h3>

            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/unec.educ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Visit UNEC Education Facebook Page"
                className="p-2 bg-blue-700 rounded-lg hover:bg-blue-600 hover:scale-105 transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-sm text-blue-200">
          <p>
            {content?.copyright_text}
          </p>
        </div>

      </div>
    </footer>
  );
}
