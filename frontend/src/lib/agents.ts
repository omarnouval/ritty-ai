export interface AgentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompt: string;
  available: boolean;
}

export const AGENT_CATEGORIES: AgentCategory[] = [
  {
    id: 'research',
    name: 'Research',
    icon: '🔬',
    description: 'Market research, competitor analysis, data insights',
    prompt: 'You are a research analyst. Help users conduct market research, analyze competitors, and extract data insights.',
    available: true,
  },
  {
    id: 'trading',
    name: 'Trading',
    icon: '📊',
    description: 'Crypto analysis, portfolio management, signals',
    prompt: 'You are a trading analyst. Help users analyze crypto markets, manage portfolios, and identify trading opportunities.',
    available: true,
  },
  {
    id: 'content',
    name: 'Content',
    icon: '✍️',
    description: 'Blog posts, social media, scripts, copywriting',
    prompt: 'You are a content creation specialist. Help users write blog posts, social media content, video scripts, and marketing copy.',
    available: true,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '📈',
    description: 'Campaigns, SEO, growth hacking, analytics',
    prompt: 'You are a marketing strategist. Help users plan campaigns, optimize SEO, analyze metrics, and grow their brand.',
    available: true,
  },
  {
    id: 'defi',
    name: 'DeFi',
    icon: '🏦',
    description: 'Yield farming, liquidity, DeFi protocols',
    prompt: 'You are a DeFi expert. Help users navigate DeFi protocols, yield farming, liquidity provision, and on-chain strategies.',
    available: true,
  },
  {
    id: 'monitor',
    name: 'Monitor',
    icon: '👁️',
    description: 'Price alerts, social tracking, on-chain monitoring',
    prompt: 'You are a monitoring agent. Track prices, social media mentions, on-chain transactions, and alert users of important events.',
    available: true,
  },
  {
    id: 'coding',
    name: 'Coding',
    icon: '💻',
    description: 'Code generation, debugging, review, architecture',
    prompt: 'You are a senior software engineer. Help users write, debug, review code and design system architecture.',
    available: true,
  },
  {
    id: 'chatbot',
    name: 'Chatbot',
    icon: '💬',
    description: 'Customer support, FAQ, conversational AI',
    prompt: 'You are a customer support chatbot. Help users with FAQs, troubleshooting, and conversational interactions.',
    available: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '🛠️',
    description: 'Describe what you need, we build it for you',
    prompt: '',
    available: false,
  },
];

export function getCategoryById(id: string): AgentCategory | undefined {
  return AGENT_CATEGORIES.find((c) => c.id === id);
}
