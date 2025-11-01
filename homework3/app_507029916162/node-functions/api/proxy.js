/**
 * API Proxy Function for EdgeOne Pages
 * 
 * This function handles all /api/* requests and proxies them to your backend service.
 * 
 * IMPORTANT: You need to deploy your Python FastAPI backend separately.
 * Options:
 * 1. Deploy to a VPS or cloud service (e.g., AWS EC2, Alibaba Cloud, Tencent Cloud)
 * 2. Use a serverless Python runtime (e.g., Vercel, Railway, Render)
 * 3. Convert backend to Node.js functions (see EDGEONE_DEPLOYMENT.md)
 * 
 * Set BACKEND_URL environment variable in EdgeOne Pages dashboard.
 */

export default async function handler(req) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // Get backend URL from environment variable
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
  
  // Get the original request path
  // EdgeOne Pages Functions: /api/* maps to this file
  // We need to preserve the full path including /api prefix
  const urlPath = req.url.replace(req.headers.host || '', '');
  
  // Construct backend URL
  const backendUrl = `${BACKEND_URL}${urlPath}`;
  
  // Get request body if exists
  let requestBody = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      requestBody = await req.json();
    } catch (e) {
      // No body or not JSON
    }
  }
  
  // Forward the request to backend
  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          Object.entries(req.headers).filter(([key]) => 
            !['host', 'content-length'].includes(key.toLowerCase())
          )
        ),
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });
    
    // Get response data
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Return response with CORS headers
    return new Response(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Backend service unavailable',
        message: error.message,
        hint: 'Please check BACKEND_URL environment variable and ensure backend is running'
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

