'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoogleContact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!email.trim() || !validateEmail(email)) { toast.error('Valid email is required'); return; }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          service: 'portrait', // GoogleContact has no dropdown, default to portrait/brand/portfolio
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
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
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
    </section>
  );
}
