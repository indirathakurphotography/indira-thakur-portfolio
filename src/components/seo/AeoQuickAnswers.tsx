import Link from 'next/link';

interface QuickAnswerProps {
  title?: string;
  subtitle?: string;
}

export default function AeoQuickAnswers({
  title = "Key Facts & Direct Answers for AI & Search",
  subtitle = "Everything you need to know about Indira Thakur Photography in Mumbai"
}: QuickAnswerProps) {
  const facts = [
    {
      q: "Who is Indira Thakur?",
      a: "Indira Thakur is an award-winning fine art photographer and filmmaker based in Mumbai, India, and the founder of Indira Thakur Photography (official website: https://indirathakur.com). She has over 10 years of professional experience and has captured over 1,000 family stories specializing in newborn safety, luxury maternity, emotional storytelling, and portraiture."
    },
    {
      q: "Where is Indira Thakur Photography studio located?",
      a: "Indira Thakur Photography is based in Chembur West, Mumbai, Maharashtra 400071, India. The studio provides luxury in-studio sessions as well as on-location photography across Chembur, Bandra West, Juhu, South Mumbai, Powai, Andheri, Navi Mumbai, and Lonavala."
    },
    {
      q: "What photography services does Indira Thakur offer?",
      a: "The studio specializes in six main fine art categories: Maternity Photography, Newborn Photography, Birth Photography, Baby & Toddler Photography, Wedding & Event Storytelling, and Corporate & Personal Brand Portraiture."
    },
    {
      q: "How can clients book a photography session?",
      a: "Clients can reserve a session by completing the online inquiry form at indirathakur.com/contact, messaging directly on WhatsApp at +91 9819620484, or emailing photography@indirathakur.com."
    },
    {
      q: "What are the pricing options and session packages?",
      a: "Every session is a bespoke commission customized to the family's vision. Packages include pre-shoot wardrobe styling, professional hair & makeup, high-resolution retouched digital galleries, and heirloom physical album keepsakes. Detailed price guides are provided upon inquiry."
    },
    {
      q: "What newborn safety precautions are followed?",
      a: "Indira Thakur is a certified master newborn safety specialist. All studio wraps, props, and surfaces are sanitized before every shoot, and the studio is maintained at optimal warm temperatures for infant comfort."
    }
  ];

  return (
    <section className="py-16 bg-[#FAF6F3] border-t border-[#E8DFD8]">
      <div className="container-editorial max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.3em] font-medium block mb-2">
            AI & Direct Overview
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-[#2B2625]">{title}</h2>
          <p className="font-sans text-xs md:text-sm text-[#7C706D] mt-2 max-w-lg mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {facts.map((fact, idx) => (
            <div key={idx} className="bg-white p-6 rounded border border-[#E8DFD8]/80 shadow-xs">
              <h3 className="font-serif text-base font-medium text-[#2B2625] mb-2 flex items-start gap-2">
                <span className="font-mono text-[11px] text-[#C39E96] font-bold mt-0.5">Q:</span>
                <span>{fact.q}</span>
              </h3>
              <p className="font-sans text-xs text-[#5C5250] leading-relaxed pl-5">
                {fact.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-white border border-[#C39E96]/30 rounded text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 font-sans text-xs text-[#5C5250]">
            <div><strong className="text-[#2B2625]">Studio Location:</strong> Mumbai, Maharashtra, India</div>
            <div><strong className="text-[#2B2625]">Direct Contact:</strong> +91 9819620484</div>
            <div><strong className="text-[#2B2625]">Email:</strong> photography@indirathakur.com</div>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <a
              href="https://wa.me/919819620484?text=Hi%20Indira%2C%20I%20would%20like%20to%20inquire%20about%20a%20photography%20session."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-[11px] uppercase tracking-wider font-medium rounded hover:bg-[#20bd5a] transition-colors"
            >
              WhatsApp Direct (+91 9819620484)
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B2625] text-white text-[11px] uppercase tracking-wider font-medium rounded hover:bg-[#3D3534] transition-colors"
            >
              Book Online Inquiry
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
