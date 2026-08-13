import { NextResponse } from 'next/server';
import Contact from '@/models/Contact';
import { CmsError, requireDatabase } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFYtpqz6yY2roay_Wdqx6JiFMGqWyKTCcF5YSyrgilRE8TfWwQqusVt_2qnqO28oCQVQ/exec';

interface ContactRequestBody {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  mumbaiArea?: string;
  shootType?: string;
  eventType?: string;
  eventDate?: string;
  eventDetails?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const body: ContactRequestBody = await request.json();
    const {
      name,
      email,
      phone = '',
      service,
      mumbaiArea = 'Mumbai',
      shootType,
      eventType = '',
      eventDate = '',
      eventDetails = '',
      message,
    } = body;

    console.log('[API /api/contact] Received contact request from:', email);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Persist before any external notification. The public form must never report
    // success for an inquiry that is not available to the Admin Contacts module.
    try {
      await requireDatabase();
      const created = await Contact.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: shootType || service || 'General Inquiry',
        message: message.trim(),
        read: false,
      });
      const verified = await Contact.findById(created._id).lean();
      if (!verified) throw new CmsError('Contact persistence verification failed.', 500);
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('[API /api/contact] Database contact storage failed:', msg);
      return NextResponse.json(
        { error: 'Your inquiry could not be saved. Please try again shortly.' },
        { status: dbError instanceof CmsError ? dbError.status : 503 }
      );
    }

    const warnings: string[] = [];

    // Notification delivery is secondary to the persisted contact record.
    const webhookPayload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      mumbaiArea: (mumbaiArea || 'Mumbai').trim(),
      shootType: (shootType || service || 'General Inquiry').trim(),
      eventType: (eventType || '').trim(),
      eventDate: (eventDate || '').trim(),
      eventDetails: (eventDetails || '').trim(),
      message: message.trim(),
    };

    try {
      const scriptResponse = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
        redirect: 'follow',
      });

      if (!scriptResponse.ok && scriptResponse.status !== 200) {
        warnings.push(`Webhook returned status ${scriptResponse.status}`);
      }
    } catch (scriptError: unknown) {
      const errMsg = scriptError instanceof Error ? scriptError.message : String(scriptError);
      console.error('[API /api/contact] Apps Script fetch error:', errMsg);
      warnings.push(`Webhook: ${errMsg}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! Indira will respond personally within 24 to 48 hours.',
        ...(warnings.length > 0 ? { warnings } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/contact] Server error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

