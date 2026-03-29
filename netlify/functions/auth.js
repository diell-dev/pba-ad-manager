import CryptoJS from 'crypto-js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function handleCors(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true })
    };
  }
}

export const handler = async (event) => {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

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

    const { action, username, password } = body;

    // ── Check session (stateless — always returns not authenticated) ──
    if (action === 'check') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No active session' })
      };
    }

    // ── Logout (no-op, client handles token removal) ──
    if (action === 'logout') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Logged out' })
      };
    }

    // ── Login ──
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing username or password' })
      };
    }

    // Only allow "Admin" username
    if (username !== 'Admin') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Encrypted token — use password as decryption key
    const encryptedToken = process.env.ENCRYPTED_FB_TOKEN;
    if (!encryptedToken) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Server configuration error: ENCRYPTED_FB_TOKEN not set' })
      };
    }

    let accessToken;
    try {
      // Decrypt using password as key
      const decrypted = CryptoJS.AES.decrypt(encryptedToken, password);
      accessToken = decrypted.toString(CryptoJS.enc.Utf8);

      // Validate token format — Facebook tokens start with "EA"
      if (!accessToken || !accessToken.startsWith('EA')) {
        throw new Error('Invalid token format after decryption');
      }
    } catch (e) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        accessToken,
        user: { name: username },
        message: 'Token retrieved successfully. Store in memory only.'
      })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
