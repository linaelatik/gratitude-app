import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { entry, checkType } = await req.json();
    // checkType can be 'initial' or 'reflection'

    const response = await openai.chat.completions.create({
      model: "openai:gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a safety monitor for a mental health journaling app. Analyze content for situations requiring IMMEDIATE professional intervention, NOT AI comfort or reflection.

FLAG (return flagged: true) for ANY of these categories:

**IMMEDIATE DANGER:**
- Active suicidal ideation with intent/plan
- Imminent self-harm with specific methods
- Plans to harm others

**ABUSE & VIOLENCE:**
- Ongoing physical abuse ("my partner hit me", "he beat me up")
- Sexual assault or rape (recent or ongoing)
- Child abuse (experiencing or witnessing)
- Domestic violence with fear for safety
- Being held against their will

**SEVERE MENTAL HEALTH CRISIS:**
- Acute psychosis with command hallucinations
- Severe dissociation with danger to self
- Severe substance overdose or withdrawal

**TRAFFICKING/EXPLOITATION:**
- Being forced into sexual acts
- Unable to leave a situation
- Controlled by another person

DO NOT FLAG for:
- Past abuse discussed in therapy context
- General relationship problems without violence
- Emotional abuse without physical danger (still concerning but not immediate crisis)
- Historical trauma being processed
- General depression/anxiety without imminent risk

When flagging abuse/violence, set category to "abuse" instead of "self_harm".

Respond ONLY with valid JSON:
{
  "flagged": boolean,
  "severity": "none" | "moderate" | "high",
  "category": "none" | "self_harm" | "suicide" | "abuse" | "psychosis" | "other_crisis",
  "reason": "brief explanation"
}`
        },
        {
          role: "user",
          content: `Analyze this ${checkType} content: "${entry}"`
        }
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"flagged": false, "severity": "none", "category": "none", "reason": ""}');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Safety check error:', error);
    return NextResponse.json({ 
      flagged: false, 
      severity: 'none',
      category: 'none',
      reason: '' 
    });
  }
}