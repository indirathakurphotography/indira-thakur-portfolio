import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contact from '@/models/Contact';

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

    const errors: string[] = [];

    // 1. Primary Database Storage (MongoDB fallback)
    try {
      await connectToDatabase();
      await Contact.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: shootType || service || 'General Inquiry',
        message: message.trim(),
        read: false,
      });
      console.log('[API /api/contact] Stored contact entry in MongoDB.');
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.warn('[API /api/contact] Database contact storage warning:', msg);
      errors.push(`Database: ${msg}`);
    }

    // 2. Apps Script Webhook (Server-side)
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

    console.log('[API /api/contact] Triggering Apps Script Webhook:', APPS_SCRIPT_URL);
    console.log('[API /api/contact] Webhook Payload:', webhookPayload);

    try {
      const scriptResponse = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
        redirect: 'follow',
      });

      console.log('[API /api/contact] Apps Script response status:', scriptResponse.status, scriptResponse.ok);
      try {
        const responseText = await scriptResponse.text();
        console.log('[API /api/contact] Apps Script response body:', responseText);
      } catch (readErr) {
        console.warn('[API /api/contact] Could not read Apps Script response body:', readErr);
      }

      if (!scriptResponse.ok && scriptResponse.status !== 200) {
        errors.push(`Webhook returned status ${scriptResponse.status}`);
      }
    } catch (scriptError: unknown) {
      const errMsg = scriptError instanceof Error ? scriptError.message : String(scriptError);
      console.error('[API /api/contact] Apps Script fetch error:', errMsg);
      errors.push(`Webhook: ${errMsg}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! Indira will respond personally within 24 to 48 hours.',
        ...(errors.length > 0 ? { warnings: errors } : {}),
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

