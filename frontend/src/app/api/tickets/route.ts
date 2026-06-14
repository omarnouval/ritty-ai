import { NextRequest, NextResponse } from 'next/server';

// In-memory ticket store (resets on cold start — upgrade to Vercel KV for production)
interface Ticket {
  id: number;
  userAddress: string;
  agentType: string;
  description: string;
  contactName: string;
  contactInfo: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  agentId?: number; // assigned agent ID when completed
}

// Module-level store
const tickets: Ticket[] = [];
let nextId = 1;

// Telegram config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function notifyTelegram(ticket: Ticket) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text = [
    `🎫 New Agent Request #${ticket.id}`,
    '',
    `👤 ${ticket.contactName}`,
    `📋 Type: ${ticket.agentType}`,
    `💬 ${ticket.description}`,
    ticket.contactInfo ? `📧 ${ticket.contactInfo}` : '',
    `🔗 ${ticket.userAddress.slice(0, 6)}...${ticket.userAddress.slice(-4)}`,
    '',
    `⏳ Status: Waiting`,
  ].filter(Boolean).join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
    });
  } catch {
    // skip
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const status = searchParams.get('status');
    const all = searchParams.get('all');

    let filtered = [...tickets];

    // Admin: return all tickets
    if (all === 'true') {
      return NextResponse.json({ tickets: filtered.reverse(), total: filtered.length });
    }

    // Filter by user address
    if (address) {
      filtered = filtered.filter(t => t.userAddress.toLowerCase() === address.toLowerCase());
    }

    // Filter by status
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }

    return NextResponse.json({ tickets: filtered.reverse(), total: filtered.length });
  } catch (error) {
    console.error('Tickets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, agentType, description, contactName, contactInfo } = body;

    if (!userAddress || !agentType || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ticket: Ticket = {
      id: nextId++,
      userAddress: userAddress.toLowerCase(),
      agentType,
      description: description.slice(0, 1000),
      contactName: (contactName || 'Anonymous').slice(0, 100),
      contactInfo: (contactInfo || '').slice(0, 200),
      status: 'waiting',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    tickets.push(ticket);

    // Notify Telegram
    await notifyTelegram(ticket);

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Tickets POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, status, agentId } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'Missing ticketId or status' }, { status: 400 });
    }

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    ticket.status = status;
    ticket.updatedAt = Date.now();
    if (status === 'completed') {
      ticket.completedAt = Date.now();
      if (agentId !== undefined) ticket.agentId = agentId;
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Tickets PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
