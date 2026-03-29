// Facebook Graph API version
const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// CORS headers — restrict origin in production
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Handle preflight requests
function handleCors(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true })
    };
  }
}

// Build query string from params object
function buildQueryString(params) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export const handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }

    const { accessToken, endpoint, method = 'GET', params = {} } = body;

    // Validate required fields
    if (!accessToken || !endpoint) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing accessToken or endpoint' })
      };
    }

    // Validate the token looks like a Facebook token
    if (!accessToken.startsWith('EA')) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid access token format' })
      };
    }

    // Validate method
    const upperMethod = (method || 'GET').toUpperCase();
    if (!['GET', 'POST', 'DELETE'].includes(upperMethod)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method must be GET, POST, or DELETE' })
      };
    }

    // Validate endpoint to prevent SSRF — must be a relative Graph API path
    if (!endpoint.startsWith('/') || endpoint.includes('://') || endpoint.includes('..') || endpoint.includes('\n') || endpoint.includes('\r')) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid endpoint format' })
      };
    }

    // Construct the full URL
    let url = `${GRAPH_API_URL}${endpoint}`;
    const requestParams = { ...params, access_token: accessToken };

    let response;

    if (upperMethod === 'GET') {
      const queryString = buildQueryString(requestParams);
      url = `${url}?${queryString}`;

      response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // POST or DELETE
      response = await fetch(url, {
        method: upperMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestParams)
      });
    }

    const data = await response.json();

    // Handle token expiry (error code 190)
    if (data.error && data.error.code === 190) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
      };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Meta API error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
