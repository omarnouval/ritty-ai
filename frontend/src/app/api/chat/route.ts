import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, createWalletClient, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ritualChain = {
  id: 1979,
  name: 'Ritual',
  network: 'ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ritualfoundation.org'] },
  },
};

const RITTY_AGENT_ABI = parseAbi([
  'function chat(string userMessage) returns (bytes32)',
  'function name() view returns (string)',
  'function category() view returns (string)',
  'function systemPrompt() view returns (string)',
  'event ChatRequested(bytes32 indexed requestId, address indexed user, string message)',
  'event ChatResponse(bytes32 indexed requestId, string response)',
]);

// Agent addresses
const AGENTS: Record<string, string> = {
  'content': '0x2C08D301Bf4Dc353c1B90FFBcF20e2F1b997698f',
  'research': '0x3d5b379De4820AF12ff2Ab797b0d3b552A91BA3e',
  'trading': '0xe7df613e37232667B3196F1DfD94A5De4306307c',
  'marketing': '0x3919071913123D25bA04f6Aa56A5f6bD36530915',
  'coding': '0x4C735C3706006C3e2Bccf0328c417ff264a3130E',
};

// System prompts for simulated responses
const SYSTEM_PROMPTS: Record<string, string> = {
  'content': 'You are a content creation specialist. Help users write blog posts, social media content, video scripts, and marketing copy.',
  'research': 'You are a research analyst. Help users conduct market research, analyze competitors, and extract data insights.',
  'trading': 'You are a trading analyst. Help users analyze crypto markets, manage portfolios, and identify trading opportunities.',
  'marketing': 'You are a marketing strategist. Help users plan campaigns, optimize SEO, analyze metrics, and grow their brand.',
  'coding': 'You are a senior software engineer. Help users write, debug, review code and design system architecture.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentCategory, message, userAddress } = body;

    if (!agentCategory || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing agentCategory or message' },
        { status: 400 }
      );
    }

    const agentAddress = AGENTS[agentCategory];
    if (!agentAddress) {
      return NextResponse.json(
        { success: false, error: 'Invalid agent category' },
        { status: 400 }
      );
    }

    // For MVP: Simulate agent response based on category
    // In production: Call the actual agent contract and listen for ChatResponse event
    const systemPrompt = SYSTEM_PROMPTS[agentCategory] || 'You are a helpful AI agent.';
    
    // Generate a contextual response based on the category and message
    const response = generateResponse(agentCategory, message, systemPrompt);

    return NextResponse.json({
      success: true,
      data: {
        response,
        agentCategory,
        agentAddress,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateResponse(category: string, message: string, systemPrompt: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Category-specific responses
  const responses: Record<string, string[]> = {
    content: [
      `Great topic! Here's a draft for your ${message} content:\n\n**Title:** ${message.charAt(0).toUpperCase() + message.slice(1)} - A Comprehensive Guide\n\n**Key Points:**\n1. Introduction to ${message}\n2. Why it matters in 2024\n3. Best practices and tips\n4. Common mistakes to avoid\n5. Conclusion with actionable steps\n\nWant me to expand on any section?`,
      `I can help you create engaging content about "${message}". Here are some angles we could explore:\n\n• Educational/tutorial style\n• Listicle format ("10 Things About ${message}")\n• Case study approach\n• Opinion/commentary piece\n\nWhich style resonates with your audience?`,
    ],
    research: [
      `Analyzing "${message}" for you:\n\n**Market Overview:**\n• Current market size and growth trends\n• Key players and competitive landscape\n• Recent developments and news\n\n**Insights:**\n• Opportunities in this space\n• Potential risks and challenges\n• Recommended next steps\n\nWould you like me to dive deeper into any specific aspect?`,
      `Here's my research findings on "${message}":\n\n**Data Points:**\n• Market sentiment: Moderate to positive\n• Growth trajectory: Upward trend\n• Key metrics to watch\n\n**Recommendations:**\n1. Monitor competitor activity\n2. Track relevant KPIs\n3. Stay updated with industry news\n\nNeed more detailed analysis?`,
    ],
    trading: [
      `Trading analysis for "${message}":\n\n**Technical Analysis:**\n• Current price action and trends\n• Support and resistance levels\n• Key indicators (RSI, MACD, Moving Averages)\n\n**Risk Assessment:**\n• Volatility: Moderate\n• Risk/Reward ratio: Favorable\n• Recommended position size: 2-3% of portfolio\n\n**Action Plan:**\n• Entry points to consider\n• Stop-loss levels\n• Take-profit targets\n\nWant specific entry/exit recommendations?`,
      `Looking at "${message}" from a trading perspective:\n\n**Market Conditions:**\n• Overall trend: [Analyzing...]\n• Volume analysis: [Processing...]\n• Momentum indicators: [Evaluating...]\n\n**Strategy Suggestions:**\n1. Short-term swing trade\n2. Long-term position\n3. Hedging options\n\nWhich timeframe are you targeting?`,
    ],
    marketing: [
      `Marketing strategy for "${message}":\n\n**Campaign Framework:**\n• Target audience definition\n• Key messaging and positioning\n• Channel selection (social, email, paid)\n\n**Growth Tactics:**\n1. Content marketing strategy\n2. SEO optimization plan\n3. Social media engagement\n4. Partnership opportunities\n\n**Metrics to Track:**\n• Conversion rates\n• Customer acquisition cost\n• ROI on marketing spend\n\nShall I create a detailed marketing plan?`,
      `Here's a marketing approach for "${message}":\n\n**Brand Positioning:**\n• Unique value proposition\n• Competitive differentiation\n• Brand voice and tone\n\n**Channel Strategy:**\n• Organic: SEO + Content\n• Paid: Targeted ads\n• Social: Community building\n\n**Timeline:**\n• Week 1-2: Setup and planning\n• Week 3-4: Launch and optimize\n• Month 2+: Scale and iterate\n\nReady to dive into execution?`,
    ],
    coding: [
      `I can help you with "${message}". Here's my approach:\n\n**Analysis:**\n• Understanding the requirements\n• Identifying the best approach\n• Planning the implementation\n\n**Implementation Plan:**\n1. Set up the project structure\n2. Write the core logic\n3. Add error handling\n4. Write tests\n5. Documentation\n\n**Code Example:**\n\`\`\`javascript\n// Example implementation for ${message}\nfunction solution() {\n  // TODO: Implement based on specific requirements\n  return result;\n}\n\`\`\`\n\nWant me to write the full implementation?`,
      `Let me help you with "${message}":\n\n**Technical Considerations:**\n• Performance implications\n• Scalability concerns\n• Security best practices\n\n**Recommended Stack:**\n• Language/Framework: [Based on requirements]\n• Database: [Optimal choice]\n• Deployment: [Best approach]\n\n**Next Steps:**\n1. Clarify specific requirements\n2. Design the architecture\n3. Implement incrementally\n4. Test thoroughly\n\nWhat specific part would you like to focus on?`,
    ],
  };

  const categoryResponses = responses[category] || responses.content;
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
}
