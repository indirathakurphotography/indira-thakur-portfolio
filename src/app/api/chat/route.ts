import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are "Indira's Concierge", a sophisticated, warm, and helpful AI assistant for Indira Thakur Photography — a premier luxury photography studio based in Mumbai, India.

YOUR ROLE:
- Assist visitors in exploring Indira Thakur's photography services, portfolio galleries, films, FAQs, and booking procedures.
- Answer questions with elegance, warmth, and professional clarity.
- Guide users to book a session or send an inquiry via the Contact page or WhatsApp.

KNOWLEDGE BASE:
1. SERVICES & SPECIALTIES:
   - Newborn Storytelling: Bespoke newborn photography capturing delicate, precious early days in studio or home.
   - Maternity Portraits: Timeless, ethereal maternity portraiture celebrating motherhood.
   - Fine Art & Toddler Portraiture: Artistic portraits of babies, children, and family heirlooms.
   - Event Photography: Naming ceremonies, baby showers, birthdays, anniversaries, weddings, get-togethers.
   - Corporate / Brand / Editorial: Commercial brand shoots, publication portfolios, profile portraits.
2. LOCATION & COVERAGE:
   - Based in Mumbai (serving Bandra, Juhu, South Mumbai, Powai, Worli, etc.).
   - Available for travel across India & worldwide upon request.
3. CONTACT & BOOKINGS:
   - Phone / WhatsApp: +91 98196 20484
   - Email: photography@indirathakur.com
   - Contact Page: /contact
   - Direct Google Form link available on the Contact page.
4. NAVIGATION ASSISTANCE:
   - Home: /
   - Gallery: /gallery
   - Services: /services
   - Films: /films
   - About Indira: /about
   - FAQs: /faq
   - Testimonials: /testimonials
   - Contact & Booking: /contact

TONE & STYLE:
- Polite, luxurious, concise, and helpful.
- Keep answers scannable (2-4 sentences or short bullet points).
- Include helpful links when relevant (e.g. "Feel free to explore our [Gallery](/gallery) or [Contact us](/contact)").`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback answer generator if API key is not set
    if (!apiKey) {
      const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
      let reply = "Thank you for reaching out to Indira Thakur Photography! ";
      if (lastUserMsg.includes('price') || lastUserMsg.includes('cost') || lastUserMsg.includes('book') || lastUserMsg.includes('contact')) {
        reply += "You can book a session or inquire about custom packages by visiting our [Contact Page](/contact) or reaching us directly on WhatsApp at +91 98196 20484.";
      } else if (lastUserMsg.includes('service') || lastUserMsg.includes('shoot') || lastUserMsg.includes('maternity') || lastUserMsg.includes('newborn')) {
        reply += "Indira specializes in Newborn Storytelling, Maternity Portraits, Fine Art Portraiture, and Special Events in Mumbai. Explore our full offerings on the [Services Page](/services).";
      } else if (lastUserMsg.includes('gallery') || lastUserMsg.includes('photo') || lastUserMsg.includes('work')) {
        reply += "You can browse our curated portfolio on the [Gallery Page](/gallery).";
      } else {
        reply += "How may I assist you today? You can inquire about sessions, view our portfolio, or connect with us on WhatsApp at +91 98196 20484.";
      }

      return NextResponse.json({ reply });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history for Gemini 2.5 Flash
    const formattedPrompt = `${SYSTEM_INSTRUCTION}\n\nUser Conversation:\n${messages
      .map((m: any) => `${m.role === 'user' ? 'Client' : 'Concierge'}: ${m.content}`)
      .join('\n')}\nConcierge:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedPrompt,
    });

    const reply = response.text || "I am at your service. Please feel free to ask about our sessions, gallery, or booking process.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      reply: "Thank you for your message! You can reach Indira Thakur directly at +91 98196 20484 or via email at photography@indirathakur.com. Explore our [Services](/services) or [Contact](/contact) page anytime."
    });
  }
}
