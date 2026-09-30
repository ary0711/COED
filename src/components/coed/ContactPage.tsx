
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

import {
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Clock,
} from 'lucide-react';

/* ============================================================
   INTERFACES
============================================================ */

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

  previewContent?: ContactPageContent | null;

  previewOfficeHours?: OfficeHour[];

  previewSocialLinks?: SocialLink[];
}

/* ============================================================
   CONTACT PAGE
============================================================ */

export function ContactPage({
  previewMode = false,
  previewContent,
  previewOfficeHours,
  previewSocialLinks,
}: ContactPageProps) {
  /* ============================================================
     STATE
  ============================================================ */

  const [showModal, setShowModal] = useState(false);

  const [modalTitle, setModalTitle] = useState('');

  const [modalMessage, setModalMessage] = useState('');

  const [modalType, setModalType] = useState<
    'success' | 'error'
  >('success');

  const [sending, setSending] = useState(false);

  const [loading, setLoading] = useState(true);

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

  /* ============================================================
     SHOW MESSAGE MODAL
  ============================================================ */

  const showMessageModal = (
    type: 'success' | 'error',
    title: string,
    message: string
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  /* ============================================================
     CLOSE MODAL
  ============================================================ */

  const closeModal = () => {
    setShowModal(false);
  };

  /* ============================================================
     SUBMIT CONTACT FORM
  ============================================================ */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (sending) return;

    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    /* ----------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------- */

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      showMessageModal(
        'error',
        'Incomplete Form',
        'Please complete all fields before submitting.'
      );

      return;
    }

    try {
      setSending(true);

      /* --------------------------------------------------------
         INSERT CONTACT MESSAGE
      -------------------------------------------------------- */

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          full_name: name,
          email: email,
          subject: subject,
          message: message,

          // New contact message
          status: 'pending',

          // New contact message starts unread
          is_read: false,
        });

      /* --------------------------------------------------------
         HANDLE DATABASE ERROR
      -------------------------------------------------------- */

      if (error) {
        console.error(
          'Error submitting contact message:',
          error
        );

        throw error;
      }

      /* --------------------------------------------------------
         CLEAR FORM
      -------------------------------------------------------- */

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });

      /* --------------------------------------------------------
         SUCCESS MODAL
      -------------------------------------------------------- */

      showMessageModal(
        'success',
        'Message Sent',
        'Thank you for contacting us. Your message has been submitted successfully.'
      );
    } catch (error: any) {
      console.error(
        'Contact submission failed:',
        error
      );

      /* --------------------------------------------------------
         ERROR MODAL
      -------------------------------------------------------- */

      showMessageModal(
        'error',
        'Submission Failed',
        error?.message ||
          'Unable to send your message. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  /* ============================================================
     LOAD CONTACT PAGE
  ============================================================ */

  useEffect(() => {
    if (!previewMode) {
      loadContactPage();
    } else {
      setLoading(false);
    }
  }, [previewMode]);

  /* ============================================================
     LOAD CONTACT PAGE DATA
  ============================================================ */

  const loadContactPage = async () => {
    try {
      setLoading(true);

      const [
        contentRes,
        hoursRes,
        socialRes,
      ] = await Promise.all([
        /* ------------------------------------------------------
           CONTACT PAGE CONTENT
        ------------------------------------------------------ */

        supabase
          .from('contact_page_content')
          .select('*')
          .single(),

        /* ------------------------------------------------------
           OFFICE HOURS
        ------------------------------------------------------ */

        supabase
          .from('contact_office_hours')
          .select('*')
          .order('sort_order'),

        /* ------------------------------------------------------
           SOCIAL LINKS
        ------------------------------------------------------ */

        supabase
          .from('contact_social_links')
          .select('*')
          .order('sort_order'),
      ]);

      /* ========================================================
         CONTENT
      ======================================================== */

      if (contentRes.error) {
        console.error(
          'Error loading contact page content:',
          contentRes.error
        );
      }

      if (contentRes.data) {
        setContent(contentRes.data);
      }

      /* ========================================================
         OFFICE HOURS
      ======================================================== */

      if (hoursRes.error) {
        console.error(
          'Error loading office hours:',
          hoursRes.error
        );
      }

      setOfficeHours(
        hoursRes.data || []
      );

      /* ========================================================
         SOCIAL LINKS
      ======================================================== */

      if (socialRes.error) {
        console.error(
          'Error loading social links:',
          socialRes.error
        );
      }

      setSocialLinks(
        socialRes.data || []
      );

    } catch (error) {
      console.error(
        'Failed to load contact page:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOADING SCREEN
  ============================================================ */

  if (!previewMode && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">

        <div className="text-center">

          <div
            className="
              w-12 h-12
              border-4
              border-blue-100
              border-t-[#2563EB]
              rounded-full
              animate-spin
              mx-auto
              mb-4
            "
          />

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

  /* ============================================================
     DISPLAY DATA
  ============================================================ */

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

  /* ============================================================
     MAIN RENDER
  ============================================================ */

  return (
    <div className="min-h-screen w-full bg-white pt-20 pb-12">

      <div className="max-w-7xl mx-auto px-6">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-14">

          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            {displayContent?.page_title}
          </h1>

          <p className="text-gray-600 max-w-2xl text-lg">
            {displayContent?.page_subtitle}
          </p>

        </div>

        {/* ======================================================
            MAIN LAYOUT
        ====================================================== */}

        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">

          {/* ====================================================
              LEFT SIDE
          ==================================================== */}

          <div className="space-y-10">

            {/* ==================================================
                CONTACT INFORMATION
            ================================================== */}

            <div className="space-y-8">

              {/* ADDRESS */}

              <div className="flex items-start gap-4">

                <div
                  className="
                    w-12 h-12
                    bg-blue-100
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shadow-sm
                  "
                >
                  <MapPin className="w-6 h-6 text-[#2563EB]" />
                </div>

                <div>

                  <h3 className="font-semibold text-[#1E3A8A]">
                    {displayContent?.address_title}
                  </h3>

                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {displayContent?.address_content}
                  </div>

                </div>

              </div>

              {/* PHONE */}

              <div className="flex items-start gap-4">

                <div
                  className="
                    w-12 h-12
                    bg-blue-100
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shadow-sm
                  "
                >
                  <Phone className="w-6 h-6 text-[#2563EB]" />
                </div>

                <div>

                  <h3 className="font-semibold text-[#1E3A8A]">
                    {displayContent?.phone_title}
                  </h3>

                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {displayContent?.phone_content}
                  </div>

                </div>

              </div>

              {/* EMAIL */}

              <div className="flex items-start gap-4">

                <div
                  className="
                    w-12 h-12
                    bg-blue-100
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shadow-sm
                  "
                >
                  <Mail className="w-6 h-6 text-[#2563EB]" />
                </div>

                <div>

                  <h3 className="font-semibold text-[#1E3A8A]">
                    {displayContent?.email_title}
                  </h3>

                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {displayContent?.email_content}
                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                OFFICE HOURS
            ================================================== */}

            <div>

              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4 flex items-center gap-2">

                <Clock className="w-5 h-5 text-[#2563EB]" />

                {displayContent?.office_hours_title}

              </h3>

              <div className="space-y-2 text-sm text-gray-700">

                {displayOfficeHours.map(
                  (hour) => (
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
                  )
                )}

              </div>

            </div>

            {/* ==================================================
                SOCIAL LINKS
            ================================================== */}

            <div>

              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">
                {displayContent?.social_title}
              </h3>

              {/* ------------------------------------------------
                  FACEBOOK ONLY
              ------------------------------------------------ */}

              <div className="flex gap-4">

                <a
                  href="https://www.facebook.com/unec.educ"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Visit UNEC Education Facebook Page"
                  className="
                    w-11 h-11
                    bg-blue-100
                    rounded-full
                    flex
                    items-center
                    justify-center
                    hover:bg-blue-200
                    hover:scale-105
                    transition-all
                    shadow-sm
                  "
                >
                  <Facebook className="w-5 h-5 text-[#2563EB]" />
                </a>

              </div>

            </div>

          </div>

          {/* ====================================================
              RIGHT SIDE - CONTACT FORM
          ==================================================== */}

          <div>

            <div
              className="
                bg-white/90
                backdrop-blur-sm
                rounded-2xl
                shadow-2xl
                p-10
                border
                border-gray-100
              "
            >

              <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
                {displayContent?.form_title}
              </h2>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NAME */}

                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Your Name"
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-[#2563EB]
                    focus:border-[#2563EB]
                    focus:outline-none
                    transition
                  "
                />

                {/* EMAIL */}

                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Email Address"
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-[#2563EB]
                    focus:border-[#2563EB]
                    focus:outline-none
                    transition
                  "
                />

                {/* SUBJECT */}

                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subject: e.target.value,
                    })
                  }
                  placeholder="Subject"
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-[#2563EB]
                    focus:border-[#2563EB]
                    focus:outline-none
                    transition
                  "
                />

                {/* MESSAGE */}

                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      message: e.target.value,
                    })
                  }
                  placeholder="Write your message..."
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-300
                    rounded-lg
                    focus:ring-2
                    focus:ring-[#2563EB]
                    focus:border-[#2563EB]
                    focus:outline-none
                    resize-none
                    transition
                  "
                />

                {/* SUBMIT BUTTON */}

                <button
                  type="submit"
                  disabled={sending}
                  className={`
                    w-full
                    py-3
                    rounded-lg
                    font-semibold
                    flex
                    items-center
                    justify-center
                    gap-2
                    shadow-md
                    transition
                    ${
                      sending
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#2563EB] hover:bg-[#1E40AF] text-white'
                    }
                  `}
                >

                  <Send className="w-5 h-5" />

                  {sending
                    ? 'Sending...'
                    : 'Submit'}

                </button>

              </form>

            </div>

          </div>

        </div>

        {/* ======================================================
            INTERACTIVE MAP
        ====================================================== */}

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

      {/* ========================================================
          SUCCESS / ERROR MODAL
      ======================================================== */}

      {showModal && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            p-4
          "
        >

          {/* BACKDROP */}

          <div
            className="
              absolute
              inset-0
              bg-black/40
              backdrop-blur-sm
            "
            onClick={closeModal}
          />

          {/* MODAL */}

          <div
            className="
              relative
              bg-white
              rounded-2xl
              shadow-2xl
              p-6
              w-[90%]
              max-w-md
              border
              border-blue-100
            "
          >

            {/* ==================================================
                ICON
            ================================================== */}

            <div
              className="
                w-14
                h-14
                rounded-full
                flex
                items-center
                justify-center
                mx-auto
                mb-4
                bg-blue-100
              "
            >

              {modalType === 'success' ? (

                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-[#2563EB]
                    text-white
                    flex
                    items-center
                    justify-center
                    text-lg
                    font-bold
                  "
                >
                  ✓
                </div>

              ) : (

                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-[#DBEAFE]
                    text-[#1E3A8A]
                    flex
                    items-center
                    justify-center
                    text-lg
                    font-bold
                  "
                >
                  !
                </div>

              )}

            </div>

            {/* ==================================================
                TITLE
            ================================================== */}

            <h2
              className="
                text-2xl
                font-bold
                text-center
                text-[#1E3A8A]
                mb-3
              "
            >
              {modalTitle}
            </h2>

            {/* ==================================================
                MESSAGE
            ================================================== */}

            <p
              className="
                text-gray-600
                text-center
                mb-6
                leading-relaxed
              "
            >
              {modalMessage}
            </p>

            {/* ==================================================
                OK BUTTON
            ================================================== */}

            <button
              onClick={closeModal}
              className="
                w-full
                py-3
                rounded-lg
                bg-[#2563EB]
                hover:bg-[#1E40AF]
                text-white
                font-semibold
                transition
              "
            >
              OK
            </button>

          </div>

        </div>

      )}

    </div>
  );
}


