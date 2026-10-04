import http.server
import socketserver
import urllib.request
import urllib.error
import ssl
import json
import os
import traceback

PORT = 3000
BACKEND_URL = "http://127.0.0.1:8080"
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

class ProxyAndStaticHTTPHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Content-Length', '0')
        self.send_header('Connection', 'close')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api' or self.path.startswith('/api/'):
            self.proxy_request('GET')
        else:
            super().do_GET()

    def do_POST(self):
        # Groq AI endpoint
        if self.path == '/ai/recommend':
            try:
                self.handle_groq_ai()
            except Exception as ex:
                traceback.print_exc()
                self._json_response(500, {"error": "Server error in AI handler", "detail": str(ex)})
            return
        if self.path == '/api' or self.path.startswith('/api/'):
            self.proxy_request('POST')
        else:
            self.send_error(405)

    def do_PUT(self):
        if self.path == '/api' or self.path.startswith('/api/'):
            self.proxy_request('PUT')
        else:
            self.send_error(405)

    def do_PATCH(self):
        if self.path == '/api' or self.path.startswith('/api/'):
            self.proxy_request('PATCH')
        else:
            self.send_error(405)

    def do_DELETE(self):
        if self.path == '/api' or self.path.startswith('/api/'):
            self.proxy_request('DELETE')
        else:
            self.send_error(405)

    # ---------- Groq AI Handler ----------
    def handle_groq_ai(self):
        print("[AI] Incoming recommendation request...", flush=True)
        if not GROQ_API_KEY:
            self._json_response(500, {"error": "GROQ_API_KEY not set"})
            return

        cl = self.headers.get('content-length')
        length = int(cl) if cl else 0
        raw = self.rfile.read(length) if length > 0 else b'{}'

        try:
            data = json.loads(raw)
        except Exception as e:
            print(f"[AI] JSON body parse error: {e}", flush=True)
            self._json_response(400, {"error": "Invalid JSON body"})
            return

        prompt = data.get("prompt", "")
        facilities = data.get("facilities", [])
        current_time = data.get("currentTime", "")
        print(f"[AI] Prompt: '{prompt}' | Facilities: {len(facilities)}", flush=True)

        fac_lines = "\n".join(
            f'- ID: "{f.get("id","")}", Name: "{f.get("name","")}", City: "{f.get("city","")}", Address: "{f.get("address","N/A")}"'
            for f in facilities
        )

        system_prompt = f"""You are ParkWise AI — a smart parking assistant. The user will describe their parking needs in natural language. Your job is to extract structured information from their request.

Current date/time: {current_time}

Available facilities:
{fac_lines}

You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no intro text) with these exact fields:
{{
  "vehicleType": "CAR" | "BIKE" | "SUV" | "VAN",
  "requiresEv": true | false,
  "facilityId": "<matched facility ID or first facility ID>",
  "facilityName": "<matched facility name>",
  "startTime": "<ISO 8601 datetime>",
  "endTime": "<ISO 8601 datetime>",
  "durationHours": <number>,
  "preferences": {{
    "preferGround": true | false,
    "preferCovered": true | false,
    "needsAccessibility": true | false
  }},
  "reasoning": "<one clear sentence explaining your interpretation>"
}}

Rules:
- If user mentions EV, electric, Tesla, Nexon EV, charging, supercharger -> requiresEv = true
- If user mentions SUV, Fortuner, Creta, Harrier, large car -> vehicleType = "SUV"
- If user mentions bike, scooter, two-wheeler -> vehicleType = "BIKE"
- If user mentions van, tempo, commercial -> vehicleType = "VAN"
- Otherwise default vehicleType = "CAR"
- Match facility by name, city, or address. If none match, use the first facility ID.
- Calculate startTime and endTime relative to current date/time. Default duration: 2 hours.
- Ground floor/easy exit/closest -> preferGround = true
- Return ONLY the raw JSON object."""

        groq_payload = json.dumps({
            "model": "openai/gpt-oss-120b",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 800
        }).encode("utf-8")

        groq_req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=groq_payload,
            method="POST"
        )
        groq_req.add_header("Content-Type", "application/json")
        groq_req.add_header("Authorization", f"Bearer {GROQ_API_KEY}")
        groq_req.add_header("User-Agent", "ParkWise-App/1.0")

        ctx = ssl.create_default_context()

        try:
            with urllib.request.urlopen(groq_req, timeout=30, context=ctx) as resp:
                groq_data = json.loads(resp.read().decode("utf-8"))
                choice = groq_data.get("choices", [{}])[0]
                msg = choice.get("message", {})
                content = msg.get("content", "").strip()
                reasoning = msg.get("reasoning", "")
                
                print(f"[AI] Groq response received, content length={len(content)}", flush=True)

                import re
                ai_result = None
                # Try parsing direct content
                if content:
                    try:
                        ai_result = json.loads(content)
                    except Exception:
                        m = re.search(r'\{[\s\S]*\}', content)
                        if m:
                            try:
                                ai_result = json.loads(m.group())
                            except Exception:
                                pass
                
                # If content didn't have valid JSON, try reasoning text
                if not ai_result and reasoning:
                    m = re.search(r'\{[\s\S]*\}', reasoning)
                    if m:
                        try:
                            ai_result = json.loads(m.group())
                        except Exception:
                            pass

                if not ai_result:
                    ai_result = {
                        "vehicleType": "CAR",
                        "requiresEv": "ev" in prompt.lower() or "tesla" in prompt.lower() or "charg" in prompt.lower(),
                        "facilityId": facilities[0].get("id") if facilities else "",
                        "facilityName": facilities[0].get("name") if facilities else "",
                        "durationHours": 2,
                        "preferences": {"preferGround": False},
                        "reasoning": content or reasoning or "Processed by Groq AI"
                    }

                print(f"[AI] Result parsed successfully: {ai_result.get('vehicleType')} EV={ai_result.get('requiresEv')}", flush=True)

                self._json_response(200, {
                    "success": True,
                    "data": ai_result,
                    "model": groq_data.get("model", "openai/gpt-oss-120b"),
                    "usage": groq_data.get("usage", {})
                })
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            print(f"[AI] Groq HTTP Error {e.code}: {err_body}", flush=True)
            self._json_response(e.code, {"error": "Groq API error", "detail": err_body})
        except Exception as ex:
            print(f"[AI] Groq Exception: {ex}", flush=True)
            self._json_response(502, {"error": "Failed to reach Groq API", "detail": str(ex)})

    def _json_response(self, code, obj):
        data = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(data)
        self.wfile.flush()

    # ---------- Backend Proxy ----------
    def proxy_request(self, method):
        cl = self.headers.get('content-length')
        length = int(cl) if cl else 0
        body = self.rfile.read(length) if length > 0 else None

        target_url = f"{BACKEND_URL}{self.path}"
        req = urllib.request.Request(target_url, data=body, method=method)
        req.add_header('Content-Type', self.headers.get('content-type', 'application/json'))

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                resp_data = response.read()
                self.send_response(response.status)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', response.headers.get('Content-Type', 'application/json'))
                self.send_header('Content-Length', str(len(resp_data)))
                self.send_header('Connection', 'close')
                self.end_headers()
                self.wfile.write(resp_data)
                self.wfile.flush()
        except urllib.error.HTTPError as e:
            err_data = e.read()
            self.send_response(e.code)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', e.headers.get('Content-Type', 'application/json'))
            self.send_header('Content-Length', str(len(err_data)))
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(err_data)
            self.wfile.flush()
        except Exception as ex:
            self.send_response(502)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            err_msg = f'{{"error": "Backend gateway error", "detail": "{str(ex)}"}}\n'.encode('utf-8')
            self.send_header('Content-Length', str(len(err_msg)))
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(err_msg)
            self.wfile.flush()

if __name__ == '__main__':
    print(f"Starting ParkWise Server + Groq AI on port {PORT}...", flush=True)
    print("GROQ_API_KEY: " + ("SET (" + GROQ_API_KEY[:8] + "...)" if GROQ_API_KEY else "NOT SET"), flush=True)
    httpd = ThreadingServer(("127.0.0.1", PORT), ProxyAndStaticHTTPHandler)
    print(f"Serving at http://localhost:{PORT} and http://127.0.0.1:{PORT}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()
