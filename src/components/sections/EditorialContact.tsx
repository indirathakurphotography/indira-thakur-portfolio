'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowUpRight } from 'lucide-react';
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
  const [debugOutput, setDebugOutput] = useState<string>('');

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugOutput('');

    if (!name.trim()) { setError('Please provide your name.'); return; }
    if (!email.trim()) { setError('Please provide your email.'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }

    setSubmitting(true);
    const debugLogs: string[] = [];

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        mumbaiArea: 'Mumbai',
        shootType: service,
        eventType: '',
        eventDate: '',
        eventDetails: '',
        message: message.trim(),
      };

      const webhookUrl = 'https://script.google.com/macros/s/AKfycbwFYtpqz6yY2roay_Wdqx6JiFMGqWyKTCcF5YSyrgilRE8TfWwQqusVt_2qnqO28oCQVQ/exec';

      console.log("Submitting payload:", payload);
      console.log("Webhook URL:", webhookUrl);

      debugLogs.push(`Webhook URL: ${webhookUrl}`);
      debugLogs.push(`Submitting payload:\n${JSON.stringify(payload, null, 2)}`);

      let response: Response;
      try {
        response = await fetch(webhookUrl, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (fetchErr: unknown) {
        console.error("Exact fetch exception:", fetchErr);
        const err = fetchErr as Error;
        const errName = err?.name || 'UnknownError';
        const errMsg = err?.message || String(fetchErr);

        console.log("error.name:", errName);
        console.log("error.message:", errMsg);

        debugLogs.push(`Exact fetch exception: ${String(fetchErr)}`);
        debugLogs.push(`error.name: ${errName}`);
        debugLogs.push(`error.message: ${errMsg}`);

        const isCors = errMsg.toLowerCase().includes('cors') || errMsg.toLowerCase().includes('access-control') || errMsg.toLowerCase().includes('origin');
        const isNetwork = errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network') || errName === 'TypeError';

        if (isCors) {
          console.log("CORS ERROR");
          debugLogs.push("CORS ERROR");
        }
        if (isNetwork) {
          console.log("NETWORK ERROR");
          debugLogs.push("NETWORK ERROR");
        }

        setDebugOutput(debugLogs.join('\n\n'));
        throw new Error('Submission failed due to network error. Please try again.');
      }

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const headersObj: Record<string, string> = {};
      try {
        response.headers.forEach((val, key) => { headersObj[key] = val; });
      } catch {
        // ignore header iteration error
      }
      console.log("Response headers:", headersObj);

      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (readErr) {
        bodyText = `[Could not read body text: ${readErr}]`;
      }
      console.log("Response body:", bodyText);

      debugLogs.push(`Response Status: ${response.status}`);
      debugLogs.push(`Response OK: ${response.ok}`);
      debugLogs.push(`Response Headers:\n${JSON.stringify(headersObj, null, 2)}`);
      debugLogs.push(`Response Body:\n${bodyText}`);

      setDebugOutput(debugLogs.join('\n\n'));

      if (!response.ok && response.status !== 200) {
        throw new Error('Submission failed. Please try again.');
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setService('Newborn Storytelling');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const contactData = config?.contact || {
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

              {debugOutput && (
                <div className="mt-6 p-4 bg-[#1E1B1A] text-[#E7DDD2] font-mono text-xs rounded border border-[#C39E96]/40 overflow-x-auto whitespace-pre-wrap">
                  <div className="font-bold text-[#C39E96] mb-2 uppercase tracking-wider text-[10px]">
                    Debug Fetch Output
                  </div>
                  {debugOutput}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </section>
  );
}
