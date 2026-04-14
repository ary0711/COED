import { useState } from 'react';
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

export function ContactPage() {
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E0ECFF] via-[#F1F5F9] to-[#DBEAFE] pt-20 pb-12">

      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            Get In Touch
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            We’d love to hear from you. Reach out to the College of Education
            for inquiries, admissions, partnerships, or general concerns.
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
                  <h3 className="font-semibold text-[#1E3A8A]">Address</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    College of Education Building <br />
                    University Main Campus <br />
                    City, State 12345
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <Phone className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A8A]">Phone</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Main: +1 (234) 567-8900 <br />
                    Admissions: +1 (234) 567-8901
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <Mail className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E3A8A]">Email</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    info@coed.university.edu <br />
                    admissions@coed.university.edu
                  </p>
                </div>
              </div>

            </div>

            {/* Office Hours */}
            <div>
              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2563EB]" />
                Office Hours
              </h3>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">8:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">9:00 AM - 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-red-500">Closed</span>
                </div>
              </div>
            </div>

            {/* Socials */}
            <div>
              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-4">
                Follow Us
              </h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition shadow-sm"
                >
                  <Facebook className="w-5 h-5 text-[#2563EB]" />
                </a>
                <a
                  href="#"
                  className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition shadow-sm"
                >
                  <Twitter className="w-5 h-5 text-[#2563EB]" />
                </a>
                <a
                  href="#"
                  className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition shadow-sm"
                >
                  <Globe className="w-5 h-5 text-[#2563EB]" />
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="lg:-mt-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-10">

              <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
                Send a Message
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
            <iframe
              title="Google Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019874107982!2d-122.41941508468113!3d37.77492977975959!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808d1f1f1f1f%3A0x1234567890abcdef!2sUniversity!5e0!3m2!1sen!2sph!4v1610000000000"
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>

      </div>
    </div>
  );
}
