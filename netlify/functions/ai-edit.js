// AI Edit Function — Interprets natural language prompts for Meta Ads changes
// Uses Anthropic Claude API to parse user intent into structured actions

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

    const systemPrompt = `You are an AI assistant for managing Meta (Facebook) Ads. The user will describe changes they want to make to their ad campaigns in natural language.

Your job is to:
1. Interpret what the user wants to do
2. Return a structured JSON action plan that the frontend can display as a preview
3. Each action should specify: the entity (campaign/adset/ad), the action type, the parameters, and a human-readable description

Available action types:
- UPDATE_STATUS (pause, activate, archive)
- UPDATE_BUDGET (daily_budget, lifetime_budget)
- UPDATE_BID (bid_amount)
- UPDATE_SCHEDULE (start_time, end_time)
- UPDATE_TARGETING (age_min, age_max, interests, locations, etc.)
- UPDATE_CREATIVE (primary_text, headline, description, call_to_action)
- DUPLICATE (entity to clone + modifications)
- CREATE (new campaign/adset/ad)
- DELETE (remove entity)

Current context (campaigns and their data):
${JSON.stringify(context || {}, null, 2)}

Respond with ONLY valid JSON in this format:
{
  "interpretation": "Brief human-readable summary of what you understood",
  "actions": [
    {
      "entity_type": "campaign|adset|ad",
      "entity_id": "the ID if known, or 'new' for creation",
      "entity_name": "human-readable name",
      "action_type": "one of the types above",
      "parameters": { ... },
      "description": "Human-readable description of this change",
      "reversible": true/false
    }
  ],
  "warnings": ["any concerns about the changes"]
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
        max_tokens: 2000,
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

    // Strip markdown code fences if present (```json ... ```)
    aiResponse = aiResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    // Try to parse the AI response as JSON
    let actionPlan
    try {
      actionPlan = JSON.parse(aiResponse)
    } catch {
      // If not valid JSON, wrap it
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
