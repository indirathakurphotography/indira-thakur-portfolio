import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

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

    // Reject prohibited content BEFORE any write (MongoDB or webhook).
    assertNoProhibitedLanguage({ name, email, message, service, eventDetails, shootType });

    // 1. Primary storage: MongoDB (single source of truth for admin dashboard)
    try {
      const db = await connectToDatabase();
      if (!db) {
        return NextResponse.json(
          { error: 'Unable to save your message right now. Please try again.' },
          { status: 503 }
        );
      }
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
      console.error('[API /api/contact] Database contact storage error:', msg);
      return NextResponse.json(
        { error: 'Unable to save your message right now. Please try again.' },
        { status: 503 }
      );
    }

    // 2. Apps Script Webhook (best-effort secondary delivery)
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

    const warnings: string[] = [];
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
  } catch (error: any) {
    console.error('[API /api/contact] Server error:', error);
    const status = error?.status || 500;
    return NextResponse.json(
      { error: error?.message || 'Something went wrong. Please try again.' },
      { status }
    );
  }
}
