import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contact from '@/models/Contact';

export const dynamic = 'force-dynamic';

interface ContactBody {
  name: string;
  phone: string;
  email?: string;
  mumbaiArea?: string;
  shootType?: string;
  eventType?: string;
  eventDate?: string;
  eventDetails?: string;
  service?: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const body: ContactBody = await request.json();
    const { name, phone, email, mumbaiArea, shootType, eventType, eventDate, eventDetails, service, message } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Full name and WhatsApp / Phone number are required' },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    // 1. Primary Database Storage (Saves inquiry to Admin Panel if MongoDB is connected)
    try {
      await connectToDatabase();
      
      const summaryMessage = message || [
        mumbaiArea ? `Mumbai Area: ${mumbaiArea}` : '',
        shootType ? `Shoot Type: ${shootType}` : '',
        eventType ? `Event Type: ${eventType}` : '',
        eventDate ? `Event Date: ${eventDate}` : '',
        eventDetails ? `Event Details: ${eventDetails}` : '',
      ].filter(Boolean).join('\n');

      await Contact.create({
        name,
        phone,
        email: email || '',
        mumbaiArea: mumbaiArea || '',
        shootType: shootType || service || '',
        eventType: eventType || '',
        eventDate: eventDate || '',
        eventDetails: eventDetails || '',
        subject: shootType || service || 'Client Inquiry',
        message: summaryMessage || 'Inquiry from website contact form',
        read: false,
      });
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.warn('Database storage warning (proceeding with Google Form sync):', msg);
    }

    // 2. Google Form Sync (Executes to ensure client Google Form & Responses Sheet receives submission)
    try {
      const gShootType = shootType === 'Corporate / Brand / Portfolio' ? 'Corporate/Brand/Portfolio' : (shootType || 'Other');
      
      let gEventType = eventType || '';
      if (eventType === 'Naming Ceremony') gEventType = 'Naming ceremony';
      else if (eventType === 'Baby Shower') gEventType = 'Baby shower';
      else if (eventType === 'Engagement / Wedding') gEventType = 'Engagement/ Wedding';
      else if (eventType === 'Get Together') gEventType = 'Get together';
      else if (eventType === 'Meeting / Seminar / Workshop') gEventType = 'Meeting/ Seminar/ Workshop';

      const getPageHistory = (type?: string) => {
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

      const gParams = new URLSearchParams();
      gParams.append('fvv', '1');
      gParams.append('pageHistory', getPageHistory(shootType));

      gParams.append('entry.2005620554', name.trim());
      gParams.append('entry.1166974658', phone.trim());
      gParams.append('entry.1045781291', email?.trim() || 'Not provided');
      gParams.append('entry.1065046570', mumbaiArea?.trim() || 'Mumbai');
      gParams.append('entry.167332123', gShootType);

      if (shootType === 'Maternity') {
        gParams.append('entry.839337160', eventDetails || message || 'Not specified');
        gParams.append('entry.224403635', eventDate || 'TBD');
      } else if (shootType === 'Newborn') {
        gParams.append('entry.833618155', eventDate || 'TBD');
        gParams.append('entry.28665809', eventDetails || message || 'None');
      } else if (shootType === 'Birth') {
        gParams.append('entry.1470325562', eventDate || 'TBD');
      } else if (shootType === 'Event') {
        gParams.append('entry.1282903224', gEventType);
        gParams.append('entry.696504431', eventDate || 'TBD');
        gParams.append('entry.391317891', eventDetails || message || 'Event Inquiry');
      } else if (shootType === 'Corporate / Brand / Portfolio') {
        gParams.append('entry.1302982852', message || eventDetails || 'Corporate Inquiry');
      } else if (shootType === 'Toddler') {
        gParams.append('entry.1734037552', eventDetails || message || 'TBD');
      }

      gParams.append('entry.361448479', eventDetails || message || `Inquiry for ${shootType}`);
      gParams.append('entry.2007233402', message || 'N/A');

      gParams.append('entry.860566375', 'I will decide after we speak');
      gParams.append('entry.875557267', 'Website Direct');

      fetch('https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/formResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform'
        },
        body: gParams.toString(),
      }).catch(err => console.warn('Server-side Google Form post warning:', err));
    } catch (gErr) {
      console.warn('Server-side Google Form sync error:', gErr);
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
