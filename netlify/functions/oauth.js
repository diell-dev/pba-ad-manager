import https from 'https';

const GRAPH_API_VERSION = '18.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// CORS headers
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Helper function to make HTTPS requests
function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Exchange authorization code for short-lived token, then extend to long-lived
async function exchangeCodeForToken(code, appId, appSecret, redirectUri) {
  try {
    // Step 1: Exchange code for short-lived token
    console.log('Exchanging code for short-lived token...');
    const codeExchangeUrl = `${GRAPH_API_URL}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
    const codeExchangeResponse = await makeRequest(codeExchangeUrl);

    if (codeExchangeResponse.statusCode !== 200 || codeExchangeResponse.data.error) {
      throw new Error(`Code exchange failed: ${JSON.stringify(codeExchangeResponse.data.error)}`);
    }

    const shortLivedToken = codeExchangeResponse.data.access_token;
    console.log('Got short-lived token');

    // Step 2: Exchange short-lived token for long-lived token
    console.log('Extending token to long-lived...');
    const extendUrl = `${GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const extendResponse = await makeRequest(extendUrl);

    if (extendResponse.statusCode !== 200 || extendResponse.data.error) {
      throw new Error(`Token extension failed: ${JSON.stringify(extendResponse.data.error)}`);
    }

    const longLivedToken = extendResponse.data.access_token;
    const expiresIn = extendResponse.data.expires_in;
    console.log(`Got long-lived token, expires in ${expiresIn} seconds`);

    // Step 3: Validate token by making a test API call
    console.log('Validating token...');
    const validateUrl = `${GRAPH_API_URL}/me?fields=id,name&access_token=${longLivedToken}`;
    const validateResponse = await makeRequest(validateUrl);

    if (validateResponse.statusCode !== 200 || validateResponse.data.error) {
      throw new Error(`Token validation failed: ${JSON.stringify(validateResponse.data.error)}`);
    }

    const user = validateResponse.data;
    console.log(`Token valid for user ${user.id}`);

    return {
      accessToken: longLivedToken,
      expiresIn,
      user
    };

  } catch (error) {
    console.error('Code exchange error:', error);
    throw error;
  }
}

// Extend an existing short-lived token to long-lived
async function extendToken(shortLivedToken, appId, appSecret) {
  try {
    console.log('Extending short-lived token to long-lived...');
    const extendUrl = `${GRAPH_API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const extendResponse = await makeRequest(extendUrl);

    if (extendResponse.statusCode !== 200 || extendResponse.data.error) {
      throw new Error(`Token extension failed: ${JSON.stringify(extendResponse.data.error)}`);
    }

    const longLivedToken = extendResponse.data.access_token;
    const expiresIn = extendResponse.data.expires_in;
    console.log(`Token extended, expires in ${expiresIn} seconds`);

    // Validate token
    console.log('Validating token...');
    const validateUrl = `${GRAPH_API_URL}/me?fields=id,name&access_token=${longLivedToken}`;
    const validateResponse = await makeRequest(validateUrl);

    if (validateResponse.statusCode !== 200 || validateResponse.data.error) {
      throw new Error(`Token validation failed: ${JSON.stringify(validateResponse.data.error)}`);
    }

    const user = validateResponse.data;
    console.log(`Token valid for user ${user.id}`);

    return {
      accessToken: longLivedToken,
      expiresIn,
      user
    };

  } catch (error) {
    console.error('Token extension error:', error);
    throw error;
  }
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true })
    };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
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

    const { code, shortLivedToken } = body;
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    // Validate environment variables
    if (!appId || !appSecret) {
      console.error('Missing Facebook app credentials');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    let result;

    if (code) {
      // Exchange authorization code for long-lived token
      if (!redirectUri) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Server configuration error' })
        };
      }
      result = await exchangeCodeForToken(code, appId, appSecret, redirectUri);
    } else if (shortLivedToken) {
      // Extend existing short-lived token
      result = await extendToken(shortLivedToken, appId, appSecret);
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing code or shortLivedToken' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('OAuth error:', error.message);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'OAuth exchange failed' })
    };
  }
};
