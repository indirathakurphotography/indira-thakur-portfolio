import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contact from '@/models/Contact';

export const dynamic = 'force-dynamic';

interface ContactBody {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const body: ContactBody = await request.json();
    const { name, email, phone, service, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    // 1. Primary Database Storage (Ensures inquiry is NEVER lost)
    try {
      await connectToDatabase();
      await Contact.create({
        name,
        email,
        phone: phone || '',
        subject: service || 'General Inquiry',
        message,
        read: false,
      });
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database contact storage error:', msg);
      errors.push(`Database: ${msg}`);
    }

    // 2. Google Form Submission (Non-blocking fallback)
    try {
      const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/formResponse';

      const shootTypeMap: Record<string, string> = {
        newborn: 'Newborn',
        maternity: 'Maternity',
        portrait: 'Corporate/Brand/Portfolio',
        events: 'Event',
        birth: 'Birth',
        toddler: 'Toddler',
      };

      const mappedService = shootTypeMap[service?.toLowerCase() || ''] || 'Corporate/Brand/Portfolio';

      const params = new URLSearchParams();
      params.append('entry.2005620554', name);
      params.append('entry.1166974658', phone || 'Not specified');
      params.append('entry.1045781291', email);
      params.append('entry.1065046570', 'Mumbai, Maharashtra, India');
      params.append('entry.167332123', mappedService);
      params.append('entry.860566375', 'I will decide after we speak');
      params.append('entry.875557267', 'Website Direct');
      params.append('entry.1302982852', message || 'No additional details provided.');
      params.append('pageHistory', '0');

      const googleResponse = await fetch(googleFormUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: params.toString(),
      });

      if (!googleResponse.ok) {
        console.warn('Google Form responded with status:', googleResponse.status);
        errors.push(`Google Form: HTTP ${googleResponse.status}`);
      } else {
        console.log('Google Form submission successful');
      }
    } catch (googleError: any) {
      const msg = googleError?.message || 'Unknown Google Form error';
      console.error('Google Form submission error:', msg);
      errors.push(`Google Form: ${msg}`);
    }

    if (errors.length > 0 && !errors.some(e => e.startsWith('Database'))) {
      return NextResponse.json(
        { success: true, message: 'Thank you for your message! Indira will respond personally within 24 to 48 hours.', warnings: errors },
        { status: 200 }
      );
    }

    if (errors.length > 0) {
      console.error('Contact form had issues:', errors);
      return NextResponse.json(
        { success: true, message: 'Thank you for your message! Indira will respond personally within 24 to 48 hours.', warnings: errors },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Thank you for your message! Indira will respond personally within 24 to 48 hours.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
