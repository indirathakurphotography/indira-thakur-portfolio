'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MessageCircle, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa6';
import { useSiteConfig } from '@/hooks/useSiteConfig';

export default function EditorialContact() {
  const { config } = useSiteConfig();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('Newborn Storytelling');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please provide your name.'); return; }
    if (!email.trim()) { setError('Please provide your email.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }

    setSubmitting(true);
    try {
      // 1. Submit to Google Form via hidden iframe
      try {
        const formEl = document.getElementById('google-contact-form-hidden') as HTMLFormElement;
        if (formEl) {
          formEl.submit();
        }
      } catch (gErr) {
        console.warn('Hidden Google Form submission error:', gErr);
      }

      // 2. Submit to MongoDB / Admin API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, service, message }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed. Please try again.');
      }
      setSubmitted(true);
      setName(''); setEmail(''); setPhone(''); setMessage('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactData: any = config?.contact || {
    eyebrow: "COMMISSION INQUIRIES",
    heading: 'Begin Your Story',
    description: 'Every bespoke photograph begins with a quiet conversation. Reach out to reserve your date or inquire about fine art sessions.',
    email: 'photography@indirathakur.com',
    phone: '+91 9819620484',
    location: 'Mumbai, Maharashtra, India · Available Worldwide',
  };

  const socialLinks = [
    {
      name: 'Instagram',
      handle: '@indirathakurphotography',
      url: 'https://www.instagram.com/indirathakurphotography/',
      icon: FaInstagram,
      detail: 'Daily editorial portfolios & behind-the-scenes',
    },
    {
      name: 'WhatsApp',
      handle: '+91 9819620484',
      url: 'https://wa.me/919819620484',
      icon: FaWhatsapp,
      detail: 'Instant consultation & availability check',
    },
    {
      name: 'Studio Email',
      handle: 'photography@indirathakur.com',
      url: 'mailto:photography@indirathakur.com',
      icon: FaEnvelope,
      detail: 'Formal booking & commission details',
    },
  ];

  return (
    <section id="contact" className="py-24 md:py-36 bg-white text-[#2B2625] relative">
      <div className="container-editorial">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Direct Info & Social Media Handles */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0.95 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {contactData.eyebrow && (
                <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block font-medium mb-2">
                  {contactData.eyebrow}
                </span>
              )}
              {contactData.heading && (
                <h2 className="font-serif text-4xl sm:text-5xl text-[#2B2625] leading-none mb-4">
                  {contactData.heading}
                </h2>
              )}
              <div className="w-10 h-px bg-[#C39E96]/40 my-6" />
              <p className="font-sans text-sm md:text-base text-[#7C706D] leading-relaxed">
                {contactData.description}
              </p>
            </motion.div>

            {/* Editorial Social Handles & Direct Communication */}
            <div className="space-y-6 pt-6 border-t border-[#E7DDD2]">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C39E96] block font-medium">
                Social & Direct Channels
              </span>

              <div className="space-y-3.5">
                {socialLinks.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-4 bg-[#FAF6F3] border border-[#E7DDD2] hover:border-[#C39E96] transition-all duration-300 rounded-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-white border border-[#E7DDD2] flex items-center justify-center text-[#2B2625] group-hover:bg-[#2B2625] group-hover:text-white transition-colors duration-300 shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96] block">
                            {item.name}
                          </span>
                          <span className="font-serif text-base text-[#2B2625] font-medium group-hover:text-[#C39E96] transition-colors block">
                            {item.handle}
                          </span>
                          <span className="font-sans text-[11px] text-[#7C706D]/80 block mt-0.5">
                            {item.detail}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#C39E96] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0" />
                    </a>
                  );
                })}
              </div>

              <div className="pt-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C39E96] block mb-1 font-medium">
                  Primary Studio Location
                </span>
                <div className="flex items-center gap-2 font-sans text-sm text-[#7C706D]">
                  <MapPin className="w-4 h-4 text-[#C39E96] shrink-0" />
                  <span>{contactData.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bespoke Inquiry Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-14 border border-[#E7DDD2] shadow-[0_10px_40px_rgba(0,0,0,0.02)] rounded-sm">
            <h3 className="font-serif text-2xl text-[#2B2625] mb-2">
              Send a Private Message
            </h3>
            <p className="font-sans text-xs text-[#7C706D] mb-8">
              Please share a few details regarding your desired session date and vision.
            </p>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 bg-[#FAF6F3] border border-[#C39E96]/30 text-center rounded-sm my-8"
                >
                  <span className="font-serif text-3xl text-[#2B2625] block mb-2">Thank You</span>
                  <p className="font-sans text-sm text-[#7C706D] leading-relaxed">
                    Your inquiry has been gracefully received. Indira will respond personally within 24 to 48 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-6 py-2.5 bg-[#2B2625] text-white font-sans text-xs uppercase tracking-[0.2em]"
                  >
                    Send Another Note
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-sans text-xs">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ananya Sharma"
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ananya@example.com"
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                        Commission Category
                      </label>
                      <select
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors"
                      >
                        <option value="Newborn Photography">Newborn Photography</option>
                        <option value="Maternity Photography">Maternity Photography</option>
                        <option value="Portraits">Portraits</option>
                        <option value="Wedding Photography">Wedding Photography</option>
                        <option value="Events">Events</option>
                        <option value="Brand Collaboration">Brand Collaboration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                      Your Vision / Session Details
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share estimated dates, locations, or special moments you wish to capture..."
                      className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#2B2625] text-white font-sans text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#3D3534] transition-all duration-500 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Transmitting Note...' : 'Submit Private Inquiry'}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Hidden iframe & Google Form element for direct Google Responses Sheet integration */}
      <iframe name="google-form-target-iframe" id="google-form-target-iframe" className="hidden" aria-hidden="true" />
      <form
        id="google-contact-form-hidden"
        action="https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/formResponse"
        method="POST"
        target="google-form-target-iframe"
        className="hidden"
        aria-hidden="true"
      >
        <input type="hidden" name="fvv" value="1" />
        <input type="hidden" name="pageHistory" value="0,6,7" />
        <input type="hidden" name="entry.2005620554" value={name} />
        <input type="hidden" name="entry.1166974658" value={phone || 'Not specified'} />
        <input type="hidden" name="entry.1045781291" value={email} />
        <input type="hidden" name="entry.1065046570" value="Mumbai" />
        <input type="hidden" name="entry.167332123" value={
          service.toLowerCase().includes('newborn') ? 'Newborn' :
          service.toLowerCase().includes('maternity') ? 'Maternity' :
          service.toLowerCase().includes('event') ? 'Event' :
          'Corporate/Brand/Portfolio'
        } />
        <input type="hidden" name="entry.860566375" value="I will decide after we speak" />
        <input type="hidden" name="entry.875557267" value="Website Direct" />
        <input type="hidden" name="entry.1302982852" value={message || 'No additional details provided.'} />
      </form>
    </section>
  );
}
