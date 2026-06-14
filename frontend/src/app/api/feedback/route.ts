import { NextRequest, NextResponse } from 'next/server';

// Telegram config from Vercel env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// Security headers
function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Type', 'application/json');
  return response;
}

// Rate limiting (in-memory)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_FEEDBACK_PER_HOUR = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }

  if (entry.count >= MAX_FEEDBACK_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

// Send to Telegram
async function sendToTelegram(feedback: {
  name: string;
  email: string;
  category: string;
  message: string;
}): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured');
    return false;
  }

  const categoryEmoji: Record<string, string> = {
    general: '💬',
    bug: '🐛',
    feature: '💡',
    agent: '🤖',
    request: '🛠️',
    ui: '🎨',
    other: '📝',
  };

  const emoji = categoryEmoji[feedback.category] || '📝';
  const nameLine = feedback.name !== 'Anonymous' ? `👤 ${feedback.name}` : '👤 Anonymous';
  const emailLine = feedback.email ? `📧 ${feedback.email}` : '';

  const text = [
    `${emoji} New Ritty.ai Feedback`,
    '',
    nameLine,
    emailLine,
    `📋 Category: ${feedback.category}`,
    '',
    `💬 ${feedback.message}`,
    '',
    `🔗 ritty-ai.vercel.app`,
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Telegram send failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      return securityHeaders(
        NextResponse.json(
          { success: false, error: 'Too many submissions. Try again later.' },
          { status: 429 }
        )
      );
    }

    const body = await request.json();
    const { name, email, category, message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return securityHeaders(
        NextResponse.json(
          { success: false, error: 'Message is required' },
          { status: 400 }
        )
      );
    }

    if (message.length > 5000) {
      return securityHeaders(
        NextResponse.json(
          { success: false, error: 'Message too long (max 5000 characters)' },
          { status: 400 }
        )
      );
    }

    const VALID_CATEGORIES = ['general', 'bug', 'feature', 'agent', 'ui', 'other'];
    const sanitized = {
      name: (name || '').toString().slice(0, 100).trim() || 'Anonymous',
      email: (email || '').toString().slice(0, 200).trim(),
      category: VALID_CATEGORIES.includes((category || 'general').toString().trim()) ? category.trim() : 'general',
      message: message.toString().slice(0, 5000).trim(),
    };

    // Send to Telegram
    const sent = await sendToTelegram(sanitized);

    if (!sent) {
      console.error('Failed to send feedback to Telegram');
      return securityHeaders(
        NextResponse.json(
          { success: false, error: 'Failed to deliver feedback. Please try again.' },
          { status: 502 }
        )
      );
    }

    return securityHeaders(
      NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully',
      })
    );
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return securityHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}
