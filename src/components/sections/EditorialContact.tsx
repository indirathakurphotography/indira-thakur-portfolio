'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MessageCircle, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { FaInstagram, FaWhatsapp, FaEnvelope, FaLinkedinIn, FaFacebookF } from 'react-icons/fa6';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { PolaroidImage } from '@/components/ui/PolaroidImage';

export default function EditorialContact() {
  const { config } = useSiteConfig();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [mumbaiArea, setMumbaiArea] = useState('');
  const [shootType, setShootType] = useState('Newborn');
  const [eventType, setEventType] = useState('Naming Ceremony');
  const [eventDate, setEventDate] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const formatShootTypeForGoogle = (type: string) => {
    if (type === 'Corporate / Brand / Portfolio') return 'Corporate/Brand/Portfolio';
    return type;
  };

  const formatEventTypeForGoogle = (type: string) => {
    switch (type) {
      case 'Naming Ceremony': return 'Naming ceremony';
      case 'Baby Shower': return 'Baby shower';
      case 'Engagement / Wedding': return 'Engagement/ Wedding';
      case 'Get Together': return 'Get together';
      case 'Meeting / Seminar / Workshop': return 'Meeting/ Seminar/ Workshop';
      default: return type;
    }
  };

  const getPageHistory = (type: string) => {
    switch (type) {
      case 'Maternity': return '0,1,7';
      case 'Newborn': return '0,2,7';
      case 'Birth': return '0,3,7';
      case 'Event': return '0,4,7';
      case 'Toddler': return '0,5,7';
      case 'Corporate / Brand / Portfolio': return '0,6,7';
      default: return '0,6,7';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please provide your full name.'); return; }
    if (!phone.trim()) { setError('Please provide your WhatsApp / Phone number.'); return; }
    if (email.trim() && !validateEmail(email)) { setError('Please enter a valid email address.'); return; }

    setSubmitting(true);
    try {
      // 1. Submit to Google Form via fetch and hidden HTML form
      try {
        const gShootType = formatShootTypeForGoogle(shootType);
        const gEventType = formatEventTypeForGoogle(eventType);
        const pageHistory = getPageHistory(shootType);

        const params = new URLSearchParams();
        params.append('fvv', '1');
        params.append('pageHistory', pageHistory);

        params.append('entry.2005620554', name.trim());
        params.append('entry.1166974658', phone.trim());
        params.append('entry.1045781291', email.trim() || 'Not provided');
        params.append('entry.1065046570', mumbaiArea.trim() || 'Mumbai');
        params.append('entry.167332123', gShootType);

        if (shootType === 'Maternity') {
          params.append('entry.839337160', eventDetails || message || 'Not specified');
          params.append('entry.224403635', eventDate || 'TBD');
        } else if (shootType === 'Newborn') {
          params.append('entry.833618155', eventDate || 'TBD');
          params.append('entry.28665809', eventDetails || message || 'None');
        } else if (shootType === 'Birth') {
          params.append('entry.1470325562', eventDate || 'TBD');
        } else if (shootType === 'Event') {
          params.append('entry.1282903224', gEventType);
          params.append('entry.696504431', eventDate || 'TBD');
          params.append('entry.391317891', eventDetails || message || 'Event details inquiry');
        } else if (shootType === 'Corporate / Brand / Portfolio') {
          params.append('entry.1302982852', message || eventDetails || 'Corporate Inquiry');
        } else if (shootType === 'Toddler') {
          params.append('entry.1734037552', eventDetails || message || 'TBD');
        }

        // Catch-all details & questions
        params.append('entry.361448479', eventDetails || message || `Inquiry for ${shootType}`);
        params.append('entry.2007233402', message || 'N/A');

        // Required Google Form footer fields
        params.append('entry.860566375', 'I will decide after we speak');
        params.append('entry.875557267', 'Website Direct');

        // Execute background fetch to Google Form (no-cors)
        fetch('https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/formResponse', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }).catch(err => console.warn('Google Form fetch submit warning:', err));

        // Submit the rendered hidden form element directly to iframe target
        const hiddenForm = document.getElementById('google-contact-form-hidden') as HTMLFormElement;
        if (hiddenForm) {
          hiddenForm.submit();
        }
      } catch (gErr) {
        console.warn('Hidden Google Form submission error:', gErr);
      }

      // 2. Submit to MongoDB / Admin API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          mumbaiArea,
          shootType,
          eventType: shootType === 'Event' ? eventType : '',
          eventDate: shootType === 'Event' ? eventDate : '',
          eventDetails: shootType === 'Event' ? eventDetails : '',
          message: message || eventDetails || `Inquiry for ${shootType} shoot`,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed. Please try again.');
      }
      setSubmitted(true);
      setName(''); setPhone(''); setEmail(''); setMumbaiArea(''); setEventDate(''); setEventDetails(''); setMessage('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const safeStr = (val: any, fallback = '') => (typeof val === 'string' ? val : (typeof val === 'number' ? String(val) : (typeof val === 'object' && val?.url ? String(val.url) : fallback)));

  const contactData: any = config?.contact || {
    eyebrow: "COMMISSION INQUIRIES",
    heading: 'Begin Your Story',
    description: 'Every bespoke photograph begins with a quiet conversation. Reach out to reserve your date or inquire about fine art sessions.',
    email: 'photography@indirathakur.com',
    phone: '+91 9819620484',
    location: 'Mumbai, India · Available Worldwide',
    studioImage: { url: '', alt: '' }
  };

  const brandData: any = config?.brand || {};
  const footerData: any = config?.footer || {};

  const googleFormUrl = safeStr(contactData?.googleFormUrl, 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform');

  const instagramUrl = safeStr(brandData?.instagramUrl) || safeStr(footerData?.instagramUrl) || 'https://www.instagram.com/indirathakurphotography/';
  const linkedinUrl = safeStr(brandData?.linkedinUrl) || safeStr(footerData?.linkedinUrl);
  const facebookUrl = safeStr(brandData?.facebookUrl) || safeStr(footerData?.facebookUrl);
  const phoneVal = safeStr(contactData?.phone) || safeStr(brandData?.contactPhone) || '+91 9819620484';
  const emailVal = safeStr(contactData?.email) || safeStr(brandData?.contactEmail) || 'photography@indirathakur.com';
  const cleanPhone = phoneVal.replace(/[^0-9]/g, '');

  const socialLinks = [
    {
      name: 'Instagram',
      handle: instagramUrl.includes('instagram.com/') ? '@' + instagramUrl.split('instagram.com/')[1].replace(/\/$/, '') : '@indirathakurphotography',
      url: instagramUrl,
      icon: FaInstagram,
      detail: 'Daily editorial portfolios & behind-the-scenes',
    },
    ...(linkedinUrl ? [{
      name: 'LinkedIn',
      handle: linkedinUrl.includes('linkedin.com/in/') ? linkedinUrl.split('linkedin.com/in/')[1].replace(/\/$/, '') : 'Indira Thakur',
      url: linkedinUrl,
      icon: FaLinkedinIn,
      detail: 'Professional background & creative collaborations',
    }] : []),
    ...(facebookUrl ? [{
      name: 'Facebook',
      handle: facebookUrl.includes('facebook.com/') ? facebookUrl.split('facebook.com/')[1].replace(/\/$/, '') : 'Indira Thakur Photography',
      url: facebookUrl,
      icon: FaFacebookF,
      detail: 'Community updates & featured galleries',
    }] : []),
    {
      name: 'WhatsApp',
      handle: phoneVal,
      url: `https://wa.me/${cleanPhone}`,
      icon: FaWhatsapp,
      detail: 'Instant consultation & availability check',
    },
    {
      name: 'Studio Email',
      handle: emailVal,
      url: `mailto:${emailVal}`,
      icon: FaEnvelope,
      detail: 'Formal booking & commission details',
    },
  ];

  const hasImage = (url?: string) => url && url.trim() !== '';

  return (
    <section id="contact" className="py-24 md:py-36 bg-white text-[#2B2625] relative">
      <div className="container-editorial">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Left Column: Direct Info & Social Media Handles */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
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
                <p className="font-sans text-sm md:text-base text-[#7C706D] leading-relaxed mb-8">
                  {contactData.description}
                </p>
              </motion.div>

              {/* Editorial Social Handles & Direct Communication */}
              <div className="space-y-6 pt-6 border-t border-[#E7DDD2]">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C39E96] block mb-2 font-medium">
                  Social & Direct Channels
                </span>

                <div className="space-y-4">
                  {socialLinks.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start justify-between p-4 bg-[#FAF6F3] border border-[#E7DDD2] hover:border-[#C39E96] transition-all duration-300 rounded-sm"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-full bg-white border border-[#E7DDD2] flex items-center justify-center text-[#2B2625] group-hover:bg-[#2B2625] group-hover:text-white transition-colors duration-300 shrink-0 mt-0.5">
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C39E96] block mb-1">
                    Primary Studio Location
                  </span>
                  <div className="flex items-center gap-2 font-sans text-sm text-[#7C706D]">
                    <MapPin className="w-4 h-4 text-[#C39E96] shrink-0" />
                    <span>{contactData.location}</span>
                  </div>
                </div>
              </div>

              {/* Google Form Section - Placed directly below Contact Details */}
              <div className="mt-8 p-6 bg-[#FAF6F3] border border-[#E7DDD2] rounded-sm shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2B2625] text-[#C39E96] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C39E96] block font-medium">
                      Direct Enquiry
                    </span>
                    <h3 className="font-serif text-xl text-[#2B2625] font-medium leading-tight">
                      Google Form
                    </h3>
                  </div>
                </div>

                <p className="font-sans text-xs text-[#7C706D] leading-relaxed">
                  You can also submit your enquiry directly using our Google Form.
                </p>

                <div className="pt-1">
                  <a
                    href={googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-[#C39E96] hover:underline break-all block mb-4"
                  >
                    {googleFormUrl}
                  </a>

                  <a
                    href={googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#2B2625] hover:bg-[#3D3534] text-white font-sans text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-sm shadow-xs group w-full sm:w-auto"
                  >
                    <span>Open Google Form</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#C39E96] group-hover:text-white transition-colors" />
                  </a>
                </div>
              </div>
            </div>

            {/* Studio Image OR Clean Luxury Quote Frame */}
            {hasImage(contactData.studioImage?.url) ? (
              <div className="mt-12 relative h-64 md:h-80 rounded-sm overflow-hidden border border-[#E7DDD2] hidden lg:block">
                <PolaroidImage
                  src={contactData.studioImage.url}
                  alt={contactData.studioImage.alt || 'Studio Atmosphere'}
                  fill
                  sizes="400px"
                  className="!w-full !h-full object-cover"
                  containerClassName="!w-full !h-full"
                />
              </div>
            ) : (
              <div className="mt-12 pt-8 border-t border-[#E7DDD2] space-y-4">
                <p className="font-serif italic text-lg text-[#2B2625]/90 leading-relaxed">
                  "Photography for me is all about preserving emotions, celebrating families, documenting milestones, and creating timeless memories that people will treasure for generations."
                </p>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-px bg-[#C39E96]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C39E96]">
                    Indira Thakur
                  </span>
                </div>
              </div>
            )}
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
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-sans text-xs rounded-sm">
                      {error}
                    </div>
                  )}

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2 font-semibold">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ananya Sharma"
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors rounded-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2 font-semibold">
                        Your WhatsApp / Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors rounded-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Mumbai Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                        Active Email ID (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ananya@example.com"
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors rounded-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                        Which area of Mumbai are you based in?
                      </label>
                      <input
                        type="text"
                        value={mumbaiArea}
                        onChange={(e) => setMumbaiArea(e.target.value)}
                        placeholder="e.g. Bandra, Juhu, South Mumbai, Powai"
                        className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Shoot Type Select */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2 font-semibold">
                      What type of shoot are you looking for? *
                    </label>
                    <select
                      value={shootType}
                      onChange={(e) => setShootType(e.target.value)}
                      className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors rounded-sm cursor-pointer"
                    >
                      <option value="Maternity">Maternity</option>
                      <option value="Birth">Birth</option>
                      <option value="Newborn">Newborn</option>
                      <option value="Toddler">Toddler</option>
                      <option value="Event">Event</option>
                      <option value="Corporate / Brand / Portfolio">Corporate / Brand / Portfolio</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* DYNAMIC EVENT FIELDS */}
                  <AnimatePresence>
                    {shootType === 'Event' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 pt-2 overflow-hidden"
                      >
                        <div className="p-5 bg-[#FAF6F3] border border-[#C39E96]/40 rounded-sm space-y-5">
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96] font-semibold block">
                            Event Specific Details
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                                Event Type *
                              </label>
                              <select
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors rounded-sm cursor-pointer"
                              >
                                <option value="Naming Ceremony">Naming Ceremony</option>
                                <option value="Baby Shower">Baby Shower</option>
                                <option value="Birthday">Birthday</option>
                                <option value="Anniversary">Anniversary</option>
                                <option value="Engagement / Wedding">Engagement / Wedding</option>
                                <option value="Get Together">Get Together</option>
                                <option value="Meeting / Seminar / Workshop">Meeting / Seminar / Workshop</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                                Event Date
                              </label>
                              <input
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors rounded-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                              Please share more details about the event
                            </label>
                            <textarea
                              rows={3}
                              value={eventDetails}
                              onChange={(e) => setEventDetails(e.target.value)}
                              placeholder="Guest count, venue location, timing, specific requirements..."
                              className="w-full px-5 py-3 bg-white border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors resize-y rounded-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* General Additional Notes */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#7C706D] mb-2">
                      Additional Notes / Special Requests
                    </label>
                    <textarea
                      rows={ shootType === 'Event' ? 3 : 4 }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share any preferred dates, custom requests or questions for Indira..."
                      className="w-full px-5 py-3.5 bg-[#FAF6F3] border border-[#E7DDD2] font-sans text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96] transition-colors resize-y rounded-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#2B2625] text-white font-sans text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#3D3534] transition-all duration-500 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Transmitting Note...' : 'Submit Inquiry'}
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
        <input type="hidden" name="pageHistory" value={getPageHistory(shootType)} />

        <input type="hidden" name="entry.2005620554" value={name} />
        <input type="hidden" name="entry.1166974658" value={phone} />
        <input type="hidden" name="entry.1045781291" value={email || 'Not provided'} />
        <input type="hidden" name="entry.1065046570" value={mumbaiArea || 'Mumbai'} />
        <input type="hidden" name="entry.167332123" value={formatShootTypeForGoogle(shootType)} />

        {/* Maternity Fields */}
        {shootType === 'Maternity' && (
          <>
            <input type="hidden" name="entry.839337160" value={eventDetails || message || 'Not specified'} />
            <input type="hidden" name="entry.224403635" value={eventDate || 'TBD'} />
          </>
        )}

        {/* Newborn Fields */}
        {shootType === 'Newborn' && (
          <>
            <input type="hidden" name="entry.833618155" value={eventDate || 'TBD'} />
            <input type="hidden" name="entry.28665809" value={eventDetails || message || 'None'} />
          </>
        )}

        {/* Birth Fields */}
        {shootType === 'Birth' && (
          <input type="hidden" name="entry.1470325562" value={eventDate || 'TBD'} />
        )}

        {/* Event Fields */}
        {shootType === 'Event' && (
          <>
            <input type="hidden" name="entry.1282903224" value={formatEventTypeForGoogle(eventType)} />
            <input type="hidden" name="entry.696504431" value={eventDate || 'TBD'} />
            <input type="hidden" name="entry.391317891" value={eventDetails || message || 'Event details inquiry'} />
          </>
        )}

        {/* Corporate Field */}
        {shootType === 'Corporate / Brand / Portfolio' && (
          <input type="hidden" name="entry.1302982852" value={message || eventDetails || 'Corporate Inquiry'} />
        )}

        {/* Toddler Field */}
        {shootType === 'Toddler' && (
          <input type="hidden" name="entry.1734037552" value={eventDetails || message || 'TBD'} />
        )}

        {/* Catch-all details & questions */}
        <input type="hidden" name="entry.361448479" value={eventDetails || message || `Inquiry for ${shootType}`} />
        <input type="hidden" name="entry.2007233402" value={message || 'N/A'} />

        {/* Required Footer Fields */}
        <input type="hidden" name="entry.860566375" value="I will decide after we speak" />
        <input type="hidden" name="entry.875557267" value="Website Direct" />
      </form>
    </section>
  );
}
