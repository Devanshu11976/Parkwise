// Lightweight zero-dependency HTTP server with Backend API Proxy + Groq AI for ParkWise Frontend
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8080;
const PUBLIC_DIR = __dirname;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/* ---------- Groq AI handler ---------- */
function handleGroqAI(req, res) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    if (!GROQ_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'GROQ_API_KEY not set. Run: set GROQ_API_KEY=gsk_...' }));
      return;
    }

    let parsed;
    try { parsed = JSON.parse(body); } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const { prompt, facilities, currentTime } = parsed;

    const systemPrompt = `You are ParkWise AI — a smart parking assistant. The user will describe their parking needs in natural language. Your job is to extract structured information from their request.

Current date/time: ${currentTime || new Date().toISOString()}

Available facilities:
${(facilities || []).map(f => `- ID: "${f.id}", Name: "${f.name}", City: "${f.city}", Address: "${f.address || 'N/A'}"`).join('\n')}

You MUST respond with ONLY a valid JSON object (no markdown, no explanation, no backticks) with these fields:
{
  "vehicleType": "CAR" | "BIKE" | "SUV" | "VAN",
  "requiresEv": true | false,
  "facilityId": "<matched facility ID or first facility ID>",
  "facilityName": "<matched facility name>",
  "startTime": "<ISO 8601 datetime>",
  "endTime": "<ISO 8601 datetime>",
  "durationHours": <number>,
  "preferences": {
    "preferGround": true | false,
    "preferCovered": true | false,
    "needsAccessibility": true | false
  },
  "reasoning": "<one sentence explaining your interpretation>"
}

Rules:
- If the user mentions EV, electric, Tesla, Nexon EV, charging, supercharger → set requiresEv to true
- If user mentions SUV, Fortuner, Creta, Harrier, large car → vehicleType = "SUV"
- If user mentions bike, scooter, two-wheeler → vehicleType = "BIKE"  
- If user mentions van, tempo, commercial → vehicleType = "VAN"
- Otherwise default to vehicleType = "CAR"
- Match facility by name, city, or address keywords. If no match, use the first facility.
- Parse times relative to the current date/time. "tomorrow 2 PM" means next day at 14:00.
- If no duration specified, default to 2 hours.
- If no time specified, assume 1 hour from now.
- Ground floor/easy exit/closest → preferGround = true
- RESPOND WITH ONLY THE JSON. No other text.`;

    const groqPayload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const groqReq = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(groqPayload)
      }
    }, (groqRes) => {
      let data = '';
      groqRes.on('data', c => data += c);
      groqRes.on('end', () => {
        try {
          const groqJson = JSON.parse(data);
          if (groqRes.statusCode !== 200) {
            res.writeHead(groqRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Groq API error', detail: groqJson }));
            return;
          }
          const content = groqJson.choices?.[0]?.message?.content || '{}';
          // Parse the LLM's JSON response
          let aiResult;
          try { aiResult = JSON.parse(content); } catch (e) {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try { aiResult = JSON.parse(jsonMatch[1] || jsonMatch[0]); } catch (e2) {
                aiResult = { error: 'Failed to parse AI response', raw: content };
              }
            } else {
              aiResult = { error: 'Failed to parse AI response', raw: content };
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: aiResult, model: groqJson.model, usage: groqJson.usage }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to parse Groq response', detail: e.message }));
        }
      });
    });

    groqReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to reach Groq API', detail: err.message }));
    });

    groqReq.write(groqPayload);
    groqReq.end();
  });
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Groq AI endpoint (handled locally, not proxied to Spring Boot)
  if (req.url === '/ai/recommend' && req.method === 'POST') {
    handleGroqAI(req, res);
    return;
  }

  // Reverse Proxy /api/ requests directly to Spring Boot backend at :8080
  if (req.url === '/api' || req.url.startsWith('/api/')) {
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${BACKEND_HOST}:${BACKEND_PORT}`
      }
    };

    const proxyReq = http.request(options, (backendRes) => {
      res.writeHead(backendRes.statusCode, backendRes.headers);
      backendRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Gateway',
        message: 'Unable to connect to Spring Boot backend at http://localhost:8080. Please ensure the backend is running.',
        detail: err.message
      }));
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Security check: ensure within public dir
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackPath, (fallbackErr, content) => {
        if (fallbackErr) {
          res.writeHead(404);
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ParkWise Frontend Server running at: http://localhost:${PORT}`);
  console.log(`🅿️ Proxying /api/* requests to Spring Boot: http://${BACKEND_HOST}:${BACKEND_PORT}/api`);
  console.log(`======================================================\n`);
});
