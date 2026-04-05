import json
import openai
import numpy as np


# System prompt used for all crisis detection calls.
# Kept as a module-level constant so it's easy to audit and update.
SAFETY_SYSTEM_PROMPT = """You are a safety monitor for a mental health journaling app. Analyze content for situations requiring IMMEDIATE professional intervention, NOT AI comfort or reflection.

FLAG (return flagged: true) for ANY of these categories:

**IMMEDIATE DANGER:**
- Active suicidal ideation with intent/plan ("I'm going to kill myself", "I will end it tonight")
- Imminent self-harm with specific methods ("I'm about to cut myself", "I have the pills ready")
- Plans to harm others with specifics

**ABUSE & VIOLENCE:**
- Ongoing physical abuse ("my partner hit me", "he beat me up", "she shoved me")
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
- Past abuse discussed in therapy context ("I left my abusive relationship 2 years ago")
- General relationship problems without violence
- Emotional abuse without physical danger
- Historical trauma being processed
- General depression/anxiety without imminent risk
- Passive suicidal thoughts without plan ("sometimes I wish I wasn't here")
- Intrusive thoughts acknowledged without intent

When flagging abuse/violence, set category to "abuse" instead of "self_harm".

Respond ONLY with valid JSON in this exact format:
{
  "flagged": true/false,
  "severity": "none" | "moderate" | "high",
  "category": "none" | "self_harm" | "suicide" | "abuse" | "psychosis" | "other_crisis",
  "reason": "brief explanation or empty string"
}"""

# Returned when no API key is available — fails open intentionally.
_NO_KEY_RESULT = {
    'flagged': False,
    'category': 'none',
    'severity': 'none',
    'reason': 'No API key available'
}

# Returned on any exception — fails open and logs the error.
def _error_result(error: Exception) -> dict:
    return {
        'flagged': False,
        'category': 'none',
        'severity': 'none',
        'reason': f'Error during check: {str(error)}'
    }


def cosine_similarity(vec1: list, vec2: list) -> float:
    """Return the cosine similarity between two embedding vectors."""
    v1, v2 = np.array(vec1), np.array(vec2)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))


def check_crisis_content(text: str, check_type: str = 'initial') -> dict:
    """
    Use GPT-4 to assess whether text contains crisis content requiring
    immediate professional intervention.

    Args:
        text: The user-submitted content to evaluate.
        check_type: Label for logging ('initial' for journal entries,
                    'reflection' for stress relief input).

    Returns:
        Dict with keys: flagged (bool), category (str), severity (str), reason (str).
        Fails open (flagged=False) if the API key is missing or the call errors.
    """
    if not openai.api_key:
        print("Warning: No OpenAI API key — safety check skipped")
        return _NO_KEY_RESULT

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": SAFETY_SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this {check_type} content: {text}"}
            ],
            temperature=0.2,
            max_tokens=200
        )

        result = json.loads(response.choices[0].message.content)
        print(f"Safety check result for {check_type}: {result}")
        return result

    except Exception as e:
        print(f"Safety check error: {e}")
        return _error_result(e)