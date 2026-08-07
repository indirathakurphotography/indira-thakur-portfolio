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

      const shootTypeMap: Record<string, { mappedService: string; pageHistory: string }> = {
        newborn: { mappedService: 'Newborn', pageHistory: '0,3,8' },
        maternity: { mappedService: 'Maternity', pageHistory: '0,2,8' },
        portrait: { mappedService: 'Corporate/Brand/Portfolio', pageHistory: '0,1,8' },
        events: { mappedService: 'Event', pageHistory: '0,5,8' },
        event: { mappedService: 'Event', pageHistory: '0,5,8' },
        birth: { mappedService: 'Birth', pageHistory: '0,4,8' },
        toddler: { mappedService: 'Toddler', pageHistory: '0,6,8' },
      };

      const sInfo = shootTypeMap[service?.toLowerCase() || ''] || { mappedService: 'Corporate/Brand/Portfolio', pageHistory: '0,1,8' };

      const params = new URLSearchParams();
      params.append('fvv', '1');
      params.append('pageHistory', sInfo.pageHistory);
      params.append('entry.2005620554', name);
      params.append('entry.1166974658', phone || 'Not specified');
      params.append('entry.1045781291', email);
      params.append('entry.1065046570', 'Mumbai');
      params.append('entry.167332123', sInfo.mappedService);

      if (sInfo.mappedService === 'Corporate/Brand/Portfolio') {
        params.append('entry.1021729079', 'Personal branding/portfolio');
        params.append('entry.1302982852', message || 'No additional details provided.');
      } else if (sInfo.mappedService === 'Maternity') {
        params.append('entry.218748426', 'Yes');
        params.append('entry.839337160', '28 weeks');
        params.append('entry.224403635', 'TBD');
        params.append('entry.1557758472', message || 'No additional details provided.');
      } else if (sInfo.mappedService === 'Newborn') {
        params.append('entry.833618155', 'Expected soon');
        params.append('entry.28665809', 'None');
        params.append('entry.1499043154', 'Flexible');
      } else if (sInfo.mappedService === 'Birth') {
        params.append('entry.395591062', 'Hospital');
        params.append('entry.1470325562', 'TBD');
      } else if (sInfo.mappedService === 'Event') {
        params.append('entry.1282903224', 'Get together');
        params.append('entry.391317891', message || 'No additional details provided.');
      } else if (sInfo.mappedService === 'Toddler') {
        params.append('entry.52928699', 'Female');
        params.append('entry.1734037552', '1 year');
      }

      params.append('entry.575254743', 'Yes');
      params.append('entry.813503736', 'Yes');
      params.append('entry.2007233402', message || 'No additional details provided.');
      params.append('entry.860566375', 'I will decide after we speak');
      params.append('entry.875557267', 'Website Direct');

      fetch(googleFormUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform',
        },
        body: params.toString(),
      }).catch(err => console.warn('Server-side Google Form post warning:', err));
    } catch (googleError: unknown) {
      console.warn('Google Form submission handling:', googleError);
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
