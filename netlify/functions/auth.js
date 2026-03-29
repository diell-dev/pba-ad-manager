import CryptoJS from 'crypto-js';

// Encrypted Facebook token (AES encrypted with admin password)
const ENCRYPTED_TOKEN = 'U2FsdGVkX18u7/8gViMEU6+x2sg4GAt2rNqxZxeEF5Y5NDZ3cBd8RVKvkWyeGb5P5QQVy26axzWfkgECITOB0UwKDc9d+7t+aRi3aR2fjXJtzwQaoJO+RK8jBUBHNSIN7BNu/o9ozEojvUS1FhOWG/nyAUKC3vUrUQ9FWzbYsCWJo814YPWcYrMWPMCpnoFmOWZ5t5jrYxSJnkfbsCxc7NG7lmRtz4ssE8DDeAvlDwYbcuNi/877iApIhjlrDrLqCRifkN+5IHOH8WFPuW2yPqDg+SGanRpEaGCuIO8BfAI=';

// CORS headers
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

    // ── Session check (stateless — no session to check) ──
    if (action === 'check') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No active session' })
      };
    }

    // ── Logout (no-op) ──
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

    if (username !== 'Admin') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Decrypt token using password as key
    let decryptedToken;
    try {
      const decrypted = CryptoJS.AES.decrypt(ENCRYPTED_TOKEN, password);
      decryptedToken = decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Validate that decrypted token starts with "EA" (Facebook token format)
    if (!decryptedToken || !decryptedToken.startsWith('EA')) {
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
        accessToken: decryptedToken,
        user: { name: username },
        message: 'Login successful'
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
