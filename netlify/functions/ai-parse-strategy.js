// AI Parse Strategy Function — Converts strategy documents into campaign structures
// Uses Anthropic Claude API to extract campaign plans from uploaded documents

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
    const { documentText } = JSON.parse(event.body)

    if (!documentText) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Document text is required' }) }
    }

    const systemPrompt = `You are an expert Meta (Facebook) Ads strategist. The user will provide a strategy document for a client's ad campaigns.

Your job is to extract and structure the campaign plan into a format that can be directly used to create campaigns via the Meta Marketing API.

Extract the following for each campaign:
- Campaign name and objective (AWARENESS, TRAFFIC, ENGAGEMENT, LEADS, APP_PROMOTION, SALES)
- Budget (daily or lifetime) and schedule
- Ad Sets with targeting (demographics, interests, behaviors, locations, placements)
- Ads with creative details (headlines, primary text, descriptions, CTAs)
- Any creative requirements (image/video specs, style notes)

Respond with ONLY valid JSON in this format:
{
  "client_name": "Client name if mentioned",
  "summary": "Brief summary of the strategy",
  "campaigns": [
    {
      "name": "Campaign Name",
      "objective": "LEADS",
      "budget_type": "daily|lifetime",
      "budget_amount": 100,
      "currency": "USD",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "ad_sets": [
        {
          "name": "Ad Set Name",
          "targeting": {
            "age_min": 25,
            "age_max": 44,
            "genders": [1, 2],
            "geo_locations": { "countries": ["US"] },
            "interests": [{ "name": "Weight loss", "id": "suggested" }],
            "behaviors": []
          },
          "optimization_goal": "LEAD_GENERATION",
          "placements": "automatic|manual",
          "manual_placements": [],
          "ads": [
            {
              "name": "Ad Name",
              "primary_text": "The main ad copy",
              "headline": "The headline",
              "description": "Description text",
              "call_to_action": "LEARN_MORE|SIGN_UP|SHOP_NOW|etc",
              "creative_type": "image|video|carousel",
              "creative_notes": "Description of what creative is needed"
            }
          ]
        }
      ]
    }
  ],
  "notes": ["Any important notes or assumptions"],
  "missing_info": ["Information that was not in the document but would be needed"]
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
        messages: [{ role: 'user', content: `Here is the strategy document:\n\n${documentText}` }],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI service error' }) }
    }

    const data = await response.json()
    const aiResponse = data.content?.[0]?.text || '{}'

    let campaignPlan
    try {
      campaignPlan = JSON.parse(aiResponse)
    } catch {
      campaignPlan = { summary: aiResponse, campaigns: [], missing_info: ['Could not parse structured response'] }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(campaignPlan),
    }
  } catch (err) {
    console.error('AI Parse Strategy error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) }
  }
}
