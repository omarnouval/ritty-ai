// Embedded skill content — loaded locally, no external dependency.
// Source: ~/.hermes/profiles/content-creator/

export const SKILLS: Record<string, string> = {
  'content-creator': `# Content Creator Agent

## Thread Structure Template
1. HOOK — grab attention (question, stat, bold claim)
2. CONTEXT — why this matters now
3. VALUE — insights, tips, data (each = 1 tweet/message)
4. CTA — follow, bookmark, repost, link

## Writing Rules
- Max 280 chars per tweet for X/Twitter threads
- No hashtag spam (0-2 max, at end if trending)
- No emoji spam (0-2 per entire thread)
- Line breaks for readability
- Number tweets: 1/N, 2/N, etc.
- Verify char count before posting
- Hook must be strong: question, stat, or bold claim
- Each piece should read standalone

## Content Types
- X/Twitter threads (hook → context → value → CTA)
- Blog posts (intro → sections → conclusion)
- Social media captions (hook → body → CTA)
- Video scripts (hook → problem → solution → CTA)
- Newsletters (subject → opener → sections → sign-off)
- Podcast show notes (summary → key points → links)

## Engagement Optimization
- Start with a pattern interrupt (bold claim, surprising stat)
- Use short paragraphs and line breaks
- End with clear CTA (what reader should do)
- Research trending topics before writing
- Analyze competitor content for gaps`,

  'xthread': `# X/Twitter Thread Creation Workflow

## Thread Structure
HOOK tweet (1/)     — attention grab (question, stat, bold claim)
CONTEXT tweet (2/)  — why this matters now
VALUE tweets (3-N/) — one insight per tweet, numbered
CTA tweet (N/N)     — follow/bookmark/repost/link

## Writing Rules
- Max 280 chars per tweet
- No hashtag spam (0-2 max, at end if trending)
- No emoji spam (0-2 per entire thread)
- Line breaks for readability
- Number tweets: 1/N, 2/N, etc.
- Verify char count before posting

## Pre-Post Checklist
- Each tweet ≤ 280 chars
- Thread reads standalone (each tweet makes sense alone)
- Hook is strong (question/stat/bold claim)
- CTA is clear (what reader should do next)
- No typos in first 3 tweets (most visible)

## Content Research (before writing)
- Search trending topics on the platform
- Check what competitors/peers post
- Find gaps in existing content

## Common Pitfalls
- Thread breaks if reply chain interrupted → always reply to last tweet ID
- Character counting → newlines count as 2 chars on X
- Rate limits → wait 15+ sec between posts in same thread`,

  'copywriting': `# Copywriting Frameworks

## AIDA (Attention → Interest → Desire → Action)
- Attention: Bold headline, surprising stat
- Interest: Relatable problem or insight
- Desire: Show the outcome/benefit
- Action: Clear CTA (buy, sign up, click)

## PAS (Problem → Agitate → Solution)
- Problem: Identify the pain point
- Agitate: Make it feel urgent
- Solution: Present your answer

## BAB (Before → After → Bridge)
- Before: Current state (pain)
- After: Desired state (gain)
- Bridge: How to get there

## Hook Formulas
- "Most people don't know this, but..."
- "I spent X doing Y. Here's what I learned:"
- "Stop doing [common mistake]. Do this instead:"
- "[Number] [things] that [outcome]:"
- "The difference between [A] and [B] is..."`,

  'content-strategy': `# Content Strategy Framework

## Content Pillars (pick 3-5)
1. Educational — teach your audience something
2. Entertaining — make them laugh or feel
3. Inspirational — motivate or share stories
4. Promotional — showcase product/offer
5. Community — engage, reply, feature users

## Content Calendar
- 3-5 posts per week minimum
- Mix pillar types (don't be one-note)
- Batch create content (write 5-10 at once)
- Repurpose: thread → blog → newsletter → video script

## Viral Content Triggers
- Contrarian takes ("Everyone says X, but actually Y")
- Personal stories with lessons
- Data-backed insights
- "How I did X in Y time" narratives
- Lists with actionable items
- Behind-the-scenes / transparency posts

## Distribution Strategy
- Post when audience is active (check analytics)
- Engage with comments within first hour
- Cross-post to multiple platforms
- Tag relevant people/accounts
- Use threads for depth, single tweets for hooks`,

  'viral-content': `# Viral Content Playbook

## Why Content Goes Viral
1. Emotion — triggers strong feeling (awe, anger, joy, surprise)
2. Identity — "this is so me" moments
3. Utility — immediately useful/savable
4. Controversy — takes a side, sparks debate
5. Story — narrative arc with tension + resolution

## Viral Hook Patterns
- "[Number] lessons from [experience]:"
- "I was wrong about [topic]. Here's why:"
- "The biggest lie in [industry]:"
- "Everyone told me [X]. They were wrong."
- "I tried [thing] for [time]. Here's what happened:"
- "Unpopular opinion: [bold claim]"

## Viral Thread Formula
1/ HOOK — bold claim or surprising stat
2/ PROBLEM — what everyone gets wrong
3/ SOLUTION — your unique insight (numbered list)
4/ PROOF — personal experience or data
5/ CTA — "Follow for more, repost to help others"

## Timing
- Best times: Tue-Thu 9-11am, 1-3pm (audience timezone)
- First 30 minutes = critical engagement window
- Reply to every comment in first hour
- Quote tweet your own thread with extra insight`,
};

// Get skill content by ID
export function getSkillContent(skillId: string): string {
  return SKILLS[skillId] || '';
}
