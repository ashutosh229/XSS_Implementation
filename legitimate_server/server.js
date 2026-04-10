/**
 * LEGITIMATE SERVER (runs on port 3000)
 * ======================================
 * Simulates a real web application that:
 *  1. Provides a login page
 *  2. Issues a session ID cookie on successful login
 *  3. Serves a protected dashboard using that session
 *
 * NOTE: This server intentionally has a vulnerability:
 *       the session cookie does NOT have the HttpOnly flag set,
 *       which allows JavaScript (XSS) to read it.
 */

const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── In-memory stores ──────────────────────────────────────────────────────────
// sessions: { sessionId → username }
const sessions = {};

// Hardcoded demo user credentials
const USERS = {
  alice: "password123",
  bob: "securepass",
};

// ── Helper ────────────────────────────────────────────────────────────────────
function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** GET /  →  Login page */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SecureBank – Login</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f172a;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #1e293b; border-radius: 12px; padding: 40px;
      width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .logo { color: #38bdf8; font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .sub  { color: #94a3b8; font-size: 14px; margin-bottom: 32px; }
    label { color: #cbd5e1; font-size: 13px; display: block; margin-bottom: 6px; }
    input {
      width: 100%; padding: 10px 14px; background: #0f172a;
      border: 1px solid #334155; border-radius: 8px; color: #f1f5f9;
      font-size: 14px; margin-bottom: 20px; outline: none;
    }
    input:focus { border-color: #38bdf8; }
    button {
      width: 100%; padding: 12px; background: #38bdf8;
      border: none; border-radius: 8px; color: #0f172a;
      font-weight: 700; font-size: 15px; cursor: pointer;
    }
    button:hover { background: #7dd3fc; }
    .info {
      margin-top: 24px; background: #0f172a; border-radius: 8px;
      padding: 14px; font-size: 12px; color: #64748b;
    }
    .info strong { color: #38bdf8; }
    .vuln-badge {
      margin-top: 16px; background: #7f1d1d; border-radius: 6px;
      padding: 10px 14px; font-size: 12px; color: #fca5a5;
      border-left: 3px solid #ef4444;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🏦 SecureBank</div>
    <div class="sub">Legitimate Banking Portal — Port 3000</div>

    <form method="POST" action="/login">
      <label>Username</label>
      <input type="text" name="username" placeholder="alice or bob" required>
      <label>Password</label>
      <input type="password" name="password" placeholder="password123" required>
      <button type="submit">Sign In</button>
    </form>

    <div class="info">
      <strong>Demo Credentials:</strong><br>
      alice / password123<br>
      bob / securepass
    </div>

    <div class="vuln-badge">
      ⚠️ Vulnerability: Session cookie is issued <strong>without HttpOnly</strong>,
      making it readable by JavaScript — enabling XSS-based session hijacking.
    </div>
  </div>
</body>
</html>
  `);
});

/** POST /login  →  Authenticate and set session cookie */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!USERS[username] || USERS[username] !== password) {
    return res.status(401).send(`
      <h2 style="color:red;font-family:sans-serif;text-align:center;margin-top:40px">
        ❌ Invalid credentials. <a href="/" style="color:#38bdf8">Try again</a>
      </h2>
    `);
  }

  // Generate a new session ID
  const sessionId = generateSessionId();
  sessions[sessionId] = username;

  console.log(`[LEGITIMATE SERVER] ✅ Login successful for "${username}"`);
  console.log(`[LEGITIMATE SERVER] 🔑 Session ID issued: ${sessionId}`);

  // ── THE VULNERABILITY ──────────────────────────────────────────────────────
  // Cookie is set WITHOUT the HttpOnly flag.
  // HttpOnly would prevent JavaScript from accessing document.cookie.
  // Without it, any XSS script CAN steal this cookie.
  // ──────────────────────────────────────────────────────────────────────────
  res.setHeader("Set-Cookie", `session_id=${sessionId}; Path=/; SameSite=None`);
  // Note: In a real secure app you would add: HttpOnly; Secure; SameSite=Strict

  res.redirect("/dashboard");
});

/** GET /dashboard  →  Protected page (validates session cookie) */
app.get("/dashboard", (req, res) => {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/session_id=([a-f0-9]+)/);

  if (!match || !sessions[match[1]]) {
    return res.redirect("/");
  }

  const username = sessions[match[1]];
  const sessionId = match[1];

  console.log(
    `[LEGITIMATE SERVER] 📄 Dashboard accessed by "${username}" with session ${sessionId}`,
  );

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SecureBank – Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; }
    header {
      background: #1e293b; padding: 16px 32px;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #334155;
    }
    .logo { color: #38bdf8; font-size: 20px; font-weight: 700; }
    .user { color: #94a3b8; font-size: 14px; }
    .main { max-width: 800px; margin: 40px auto; padding: 0 24px; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .greeting { color: #94a3b8; margin-bottom: 32px; }
    .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
    .card {
      background: #1e293b; border-radius: 12px; padding: 24px;
      border: 1px solid #334155;
    }
    .card-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .card-value { font-size: 28px; font-weight: 700; margin-top: 8px; color: #38bdf8; }
    .session-box {
      background: #0f172a; border-radius: 10px; padding: 20px;
      border: 1px solid #334155; margin-bottom: 24px;
    }
    .session-box h3 { color: #f59e0b; margin-bottom: 12px; font-size: 14px; }
    .cookie-val {
      font-family: monospace; font-size: 13px; color: #a3e635;
      word-break: break-all; background: #1e293b;
      padding: 10px; border-radius: 6px;
    }
    .warning {
      background: #7f1d1d; border-radius: 10px; padding: 20px;
      border-left: 4px solid #ef4444;
    }
    .warning h3 { color: #fca5a5; margin-bottom: 8px; }
    .warning p  { color: #fca5a5; font-size: 13px; line-height: 1.6; }
  </style>
</head>
<body>
  <header>
    <div class="logo">🏦 SecureBank</div>
    <div class="user">Logged in as: <strong>${username}</strong></div>
  </header>
  <div class="main">
    <h1>Welcome back, ${username}! 👋</h1>
    <p class="greeting">Your account is active. Session successfully established.</p>

    <div class="cards">
      <div class="card">
        <div class="card-label">Checking Balance</div>
        <div class="card-value">$12,450.00</div>
      </div>
      <div class="card">
        <div class="card-label">Savings Balance</div>
        <div class="card-value">$34,800.00</div>
      </div>
    </div>

    <div class="session-box">
      <h3>🔑 Your Session Cookie (visible to JavaScript — the vulnerability!)</h3>
      <div class="cookie-val">session_id=${sessionId}</div>
    </div>

    <div class="warning">
      <h3>⚠️ Security Demo Note</h3>
      <p>
        The session ID above is stored in your browser cookie WITHOUT the <code>HttpOnly</code> flag.
        This means any JavaScript on any page you visit (including a malicious one) can read
        <code>document.cookie</code> and steal this value — granting an attacker full access to your account.
        Now visit the <strong>Attacker Server on port 4000</strong> to see the attack in action.
      </p>
    </div>
  </div>
</body>
</html>
  `);
});

/** GET /profile?session=<id>  →  Attacker uses stolen session to access data */
app.get("/profile", (req, res) => {
  const sessionId = req.query.session || "";
  const username = sessions[sessionId];

  if (!username) {
    console.log(`[LEGITIMATE SERVER] ❌ Invalid session attempt: ${sessionId}`);
    return res.status(403).json({ error: "Invalid or expired session" });
  }

  console.log(
    `[LEGITIMATE SERVER] 🚨 HIJACKED SESSION USED! Session "${sessionId}" → user "${username}"`,
  );

  res.json({
    status: "success",
    message: "Session hijack successful!",
    authenticated_as: username,
    session_id: sessionId,
    account_data: {
      username,
      email: `${username}@securebank.com`,
      balance_checking: "$12,450.00",
      balance_savings: "$34,800.00",
      last_login: new Date().toISOString(),
      account_number: "SB-" + Math.floor(100000 + Math.random() * 900000),
    },
  });
});

/** GET /sessions  →  Debug endpoint to view all active sessions */
app.get("/sessions", (req, res) => {
  res.json({ active_sessions: sessions });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🏦 LEGITIMATE SERVER running at http://localhost:${PORT}`);
  console.log(`   Login page:  http://localhost:${PORT}/`);
  console.log(`   Dashboard:   http://localhost:${PORT}/dashboard`);
  console.log(`   Sessions:    http://localhost:${PORT}/sessions\n`);
});
