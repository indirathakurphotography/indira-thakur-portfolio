import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Brand from '@/models/Brand';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    const query = includeAll ? {} : { isActive: true };
    let brands = await Brand.find(query).sort({ displayOrder: 1, createdAt: -1 });

    // Seed default brands if DB is empty
    if (brands.length === 0) {
      const count = await Brand.countDocuments();
      if (count === 0) {
        const defaultBrands = [
          {
            name: 'Vogue India',
            logo: { url: '', alt: 'Vogue India' },
            websiteUrl: 'https://www.vogue.in',
            category: 'Featured In',
            displayOrder: 0,
            isActive: true,
          },
          {
            name: "Harper's Bazaar",
            logo: { url: '', alt: "Harper's Bazaar" },
            websiteUrl: 'https://www.harpersbazaar.in',
            category: 'Featured In',
            displayOrder: 1,
            isActive: true,
          },
          {
            name: 'Femina India',
            logo: { url: '', alt: 'Femina India' },
            websiteUrl: 'https://www.femina.in',
            category: 'Featured In',
            displayOrder: 2,
            isActive: true,
          },
          {
            name: 'Grazia India',
            logo: { url: '', alt: 'Grazia India' },
            websiteUrl: 'https://www.grazia.co.in',
            category: 'Featured In',
            displayOrder: 3,
            isActive: true,
          },
          {
            name: 'Times of India',
            logo: { url: '', alt: 'Times of India' },
            websiteUrl: 'https://timesofindia.indiatimes.com',
            category: 'Featured In',
            displayOrder: 4,
            isActive: true,
          },
          {
            name: 'Night Night',
            logo: { url: '', alt: 'Night Night' },
            websiteUrl: '',
            category: 'Trusted By',
            displayOrder: 5,
            isActive: true,
          },
          {
            name: 'Manbhari Sarees',
            logo: { url: '', alt: 'Manbhari Sarees' },
            websiteUrl: '',
            category: 'Trusted By',
            displayOrder: 6,
            isActive: true,
          },
          {
            name: 'Reeora',
            logo: { url: '', alt: 'Reeora' },
            websiteUrl: '',
            category: 'Trusted By',
            displayOrder: 7,
            isActive: true,
          },
          {
            name: 'Indie Loom',
            logo: { url: '', alt: 'Indie Loom' },
            websiteUrl: '',
            category: 'Trusted By',
            displayOrder: 8,
            isActive: true,
          },
          {
            name: 'Taj Hotels & Resorts',
            logo: { url: '', alt: 'Taj Hotels' },
            websiteUrl: 'https://www.tajhotels.com',
            category: 'Trusted By',
            displayOrder: 9,
            isActive: true,
          },
          {
            name: 'Oberoi Luxury Hotels',
            logo: { url: '', alt: 'Oberoi Luxury Hotels' },
            websiteUrl: 'https://www.oberoihotels.com',
            category: 'Trusted By',
            displayOrder: 10,
            isActive: true,
          }
        ];

        await Brand.insertMany(defaultBrands);
        brands = await Brand.find(query).sort({ displayOrder: 1, createdAt: -1 });
      }
    }

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();

    if (!body.name || !body.logo || !body.logo.url) {
      return NextResponse.json(
        { error: 'Brand name and logo URL are required' },
        { status: 400 }
      );
    }

    const count = await Brand.countDocuments();

    const brand = await Brand.create({
      name: body.name,
      logo: {
        url: body.logo.url,
        alt: body.logo.alt || body.name,
      },
      websiteUrl: body.websiteUrl || '',
      category: body.category || 'Featured In',
      displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : count,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();

    // Reorder or bulk update
    if (Array.isArray(body)) {
      const updates = body.map((item: any, index: number) => {
        return Brand.findByIdAndUpdate(item._id, {
          displayOrder: index,
          ...(typeof item.isActive === 'boolean' ? { isActive: item.isActive } : {}),
        });
      });
      await Promise.all(updates);
      const updatedBrands = await Brand.find().sort({ displayOrder: 1, createdAt: -1 });
      return NextResponse.json(updatedBrands);
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error updating brands reorder:', error);
    return NextResponse.json({ error: 'Failed to reorder brands' }, { status: 500 });
  }
}
