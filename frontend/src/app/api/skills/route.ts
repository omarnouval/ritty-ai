import { NextResponse } from 'next/server';

const SCRAPER_URL = process.env.SCRAPER_URL || 'https://variations-pixel-ebony-film.trycloudflare.com';

export async function GET() {
  try {
    const res = await fetch(`${SCRAPER_URL}/skills`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Skills fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
