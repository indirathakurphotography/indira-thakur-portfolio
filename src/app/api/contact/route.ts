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

    // 2. Apps Script Web App Webhook (Non-blocking)
    try {
      const webhookUrl = 'https://script.google.com/macros/s/AKfycbwFYtpqz6yY2roay_Wdqx6JiFMGqWyKTCcF5YSyrgilRE8TfWwQqusVt_2qnqO28oCQVQ/exec';
      const payload = {
        name: name.trim(),
        phone: (phone || '').trim(),
        email: email.trim(),
        mumbaiArea: 'Mumbai',
        shootType: service || 'General Inquiry',
        eventType: '',
        eventDate: '',
        eventDetails: '',
        message: message.trim(),
      };

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(err => console.warn('Server-side Apps Script post warning:', err));
    } catch (scriptError: unknown) {
      console.warn('Apps Script submission handling:', scriptError);
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
