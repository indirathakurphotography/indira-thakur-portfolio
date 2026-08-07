'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { motion, AnimatePresence } from 'framer-motion';

function getGoogleFormFields(service: string, name: string, email: string, phone: string, message: string) {
  const lower = (service || '').toLowerCase();
  
  let mappedService = 'Corporate/Brand/Portfolio';
  let pageHistory = '0,1,8';

  if (lower.includes('newborn')) {
    mappedService = 'Newborn';
    pageHistory = '0,3,8';
  } else if (lower.includes('maternity')) {
    mappedService = 'Maternity';
    pageHistory = '0,2,8';
  } else if (lower.includes('birth')) {
    mappedService = 'Birth';
    pageHistory = '0,4,8';
  } else if (lower.includes('event') || lower.includes('wedding')) {
    mappedService = 'Event';
    pageHistory = '0,5,8';
  } else if (lower.includes('toddler')) {
    mappedService = 'Toddler';
    pageHistory = '0,6,8';
  }

  return {
    mappedService,
    pageHistory,
    name: name.trim(),
    phone: phone.trim() || 'Not specified',
    email: email.trim(),
    location: 'Mumbai',
    privacy: 'I will decide after we speak',
    source: 'Website Direct',
    details: message.trim() || 'No additional details provided.',
  };
}

export default function GoogleContact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const gFields = getGoogleFormFields('portrait', name, email, phone, message);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!email.trim() || !validateEmail(email)) { toast.error('Valid email is required'); return; }

    setSubmitting(true);
    try {
      // 1. Submit to Google Form via hidden iframe
      try {
        const formEl = document.getElementById('google-contact-form-hidden-gc') as HTMLFormElement;
        if (formEl) {
          formEl.submit();
        }
      } catch (gErr) {
        console.warn('Hidden Google Form submission error:', gErr);
      }

      // 2. Submit to API endpoint for primary storage
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          service: 'portrait',
          message: message || 'Contact from main homepage contact form.'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form.');
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      toast.success('Thank you! Your message has been received.');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="container-editorial">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-12"
              >
                <span className="font-mono text-[11px] text-magenta/60 uppercase tracking-[0.3em]">Get In Touch</span>
                <h2 className="font-serif text-3xl md:text-5xl text-rich-black mt-3">Thank You!</h2>
                <div className="w-5 h-px bg-magenta/25 mt-6 mx-auto" />
                <p className="font-sans text-sm text-warm-gray/50 mt-5 max-w-md mx-auto leading-relaxed">
                  Your message has been received successfully and submitted directly. We&apos;ll get back to you soon on the provided details.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-8 px-8 py-3.5 min-h-[44px] bg-rich-black text-white font-sans text-[11px] uppercase tracking-[0.25em] hover:bg-charcoal transition-colors duration-500 rounded"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div>
                  <span className="font-mono text-[11px] text-magenta/60 uppercase tracking-[0.3em]">Get In Touch</span>
                  <h2 className="font-serif text-3xl md:text-5xl text-rich-black leading-[1.1] mt-3">Begin Your Story</h2>
                  <div className="w-5 h-px bg-magenta/25 mt-6" />
                  <p className="font-sans text-sm text-warm-gray/50 mt-5 leading-relaxed">Every beautiful photograph begins with a conversation. Send us a message and we&apos;ll be in touch.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-10 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-warm-gray/40 mb-2">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field w-full disabled:opacity-60"
                        placeholder="Your name"
                        required
                        disabled={submitting}
                        aria-label="Your name"
                      />
                    </div>
                    <div>
                      <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-warm-gray/40 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field w-full disabled:opacity-60"
                        placeholder="your@email.com"
                        required
                        disabled={submitting}
                        aria-label="Your email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-warm-gray/40 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field w-full disabled:opacity-60"
                      placeholder="+91 99999 99999"
                      disabled={submitting}
                      aria-label="Your phone"
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-warm-gray/40 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="textarea-field w-full disabled:opacity-60"
                      rows={4}
                      placeholder="Tell us about your vision..."
                      disabled={submitting}
                      aria-label="Your message"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 min-h-[48px] bg-rich-black text-white font-sans text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-500 hover:bg-charcoal disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Sending Message...</span>
                      </>
                    ) : 'Send Message'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden iframe & Google Form element for direct Google Responses Sheet integration */}
      <iframe name="google-form-target-iframe-gc" id="google-form-target-iframe-gc" className="hidden" aria-hidden="true" />
      <form
        id="google-contact-form-hidden-gc"
        action="https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/formResponse"
        method="POST"
        target="google-form-target-iframe-gc"
        className="hidden"
        aria-hidden="true"
      >
        <input type="hidden" name="fvv" value="1" />
        <input type="hidden" name="pageHistory" value={gFields.pageHistory} />
        <input type="hidden" name="entry.2005620554" value={gFields.name} />
        <input type="hidden" name="entry.1166974658" value={gFields.phone} />
        <input type="hidden" name="entry.1045781291" value={gFields.email} />
        <input type="hidden" name="entry.1065046570" value={gFields.location} />
        <input type="hidden" name="entry.167332123" value={gFields.mappedService} />

        {/* Section Specific Inputs */}
        <input type="hidden" name="entry.1021729079" value="Personal branding/portfolio" />
        <input type="hidden" name="entry.1302982852" value={gFields.details} />

        {/* Page 8 (Final Page) Inputs */}
        <input type="hidden" name="entry.575254743" value="Yes" />
        <input type="hidden" name="entry.813503736" value="Yes" />
        <input type="hidden" name="entry.2007233402" value={gFields.details} />
        <input type="hidden" name="entry.860566375" value={gFields.privacy} />
        <input type="hidden" name="entry.875557267" value={gFields.source} />
      </form>
    </section>
  );
}
