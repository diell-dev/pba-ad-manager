// AI Edit Function — Full Meta Marketing API command center
// Interprets natural language into executable Meta API actions

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI service not configured' }) }
  }

  try {
    const { prompt, context } = JSON.parse(event.body)

    if (!prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) }
    }

    const systemPrompt = `You are the AI engine behind PBA Ad Manager — a Meta Ads management tool for Polar Bear Agency. You translate natural language into executable Meta Marketing API v21.0 actions.

CRITICAL RULES:
- Always use REAL entity IDs from the context data. Never use placeholder IDs.
- If an action requires data not present in the context, explain what's missing in warnings and set actions to [].
- Budget values should be in DOLLARS (the frontend converts to cents).
- Always match campaigns/adsets/ads by name or metrics from the provided context.
- Return ONLY valid JSON. No markdown, no code fences, no extra text.

AVAILABLE ACTION TYPES AND THEIR PARAMETERS:

1. UPDATE_STATUS — Change campaign/adset/ad status
   parameters: { "status": "ACTIVE" | "PAUSED" | "ARCHIVED" }
   entity_type: campaign, adset, or ad
   Notes: Use PAUSED to stop, ACTIVE to resume, ARCHIVED to soft-delete

2. UPDATE_BUDGET — Change daily or lifetime budget
   parameters: { "daily_budget": number, "lifetime_budget": number }
   entity_type: campaign or adset (whichever has the budget)
   Notes: Values in dollars. Only one of daily/lifetime should be set per entity. For percentage increases, calculate the new value from current budget in context.

3. UPDATE_BID — Change bid amount on ad set
   parameters: { "bid_amount": number }
   entity_type: adset
   Notes: Value in dollars

4. UPDATE_SCHEDULE — Change start/end times
   parameters: { "start_time": "ISO8601", "end_time": "ISO8601" }
   entity_type: campaign or adset

5. UPDATE_TARGETING — Modify audience targeting on ad set
   parameters: { "targeting": { "age_min": number, "age_max": number, "genders": [1,2], "geo_locations": { "countries": ["US"] }, "interests": [{"id": "...", "name": "..."}], "custom_audiences": [{"id": "..."}], "excluded_custom_audiences": [{"id": "..."}] } }
   entity_type: adset
   Notes: Targeting is complex — only include the fields being changed

6. UPDATE_CREATIVE — Change ad creative fields
   parameters: { "name": "new name" }
   entity_type: ad
   Notes: Full creative swaps require creating a new ad creative object first

7. UPDATE_NAME — Rename any entity
   parameters: { "name": "New Name" }
   entity_type: campaign, adset, or ad

8. DUPLICATE — Copy a campaign, ad set, or ad
   parameters: { "rename_suffix": " (Copy)", "deep_copy": true }
   entity_type: campaign, adset, or ad
   Notes: deep_copy=true copies child entities too (e.g. campaign → adsets → ads)

9. DELETE — Archive/remove entity (sets status to DELETED)
   parameters: {}
   entity_type: campaign, adset, or ad
   Notes: This is irreversible at API level. Always set reversible: false.

10. UPDATE_OPTIMIZATION — Change ad set optimization goal
    parameters: { "optimization_goal": "LINK_CLICKS" | "IMPRESSIONS" | "REACH" | "CONVERSIONS" | "LANDING_PAGE_VIEWS" | "LEAD_GENERATION" | "APP_INSTALLS" | "VALUE" }
    entity_type: adset

11. UPDATE_BILLING — Change billing event
    parameters: { "billing_event": "IMPRESSIONS" | "LINK_CLICKS" | "APP_INSTALLS" }
    entity_type: adset

12. UPDATE_PACING — Change pacing type
    parameters: { "pacing_type": ["standard"] | ["day_parting"] }
    entity_type: adset

ANALYSIS CAPABILITIES (when user asks to "show me" or "find" or "analyze"):
- You can analyze the campaign data in context to find patterns
- Compare metrics across campaigns (spend, CTR, CPC, frequency, ROAS, etc.)
- Identify underperformers, high-frequency fatigue, budget waste
- For analysis-only requests, return actions: [] and put your analysis in the interpretation field
- You CAN suggest actions based on analysis — include them with clear descriptions

CONTEXT DATA:
${JSON.stringify(context || {}, null, 2)}

RESPONSE FORMAT (strict JSON only):
{
  "interpretation": "Clear explanation of what you'll do and why",
  "actions": [
    {
      "entity_type": "campaign|adset|ad",
      "entity_id": "the real ID from context",
      "entity_name": "human-readable name from context",
      "action_type": "one of the types above",
      "parameters": { ... },
      "description": "Human-readable description of this specific change",
      "reversible": true or false
    }
  ],
  "warnings": ["any risks or concerns about these changes"]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI service error' }) }
    }

    const data = await response.json()
    let aiResponse = data.content?.[0]?.text || '{}'

    // Strip markdown code fences if present
    aiResponse = aiResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let actionPlan
    try {
      actionPlan = JSON.parse(aiResponse)
    } catch {
      actionPlan = { interpretation: aiResponse, actions: [], warnings: ['Could not parse structured response'] }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(actionPlan),
    }
  } catch (err) {
    console.error('AI Edit error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
