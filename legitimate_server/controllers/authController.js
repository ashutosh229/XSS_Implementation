const USERS = require("../db/users");
const sessions = require("../db/sessions");
const { generateSessionId } = require("../utils/session");

exports.getLoginPage = (req, res) => {
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
};

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!USERS[username] || USERS[username] !== password) {
    return res.status(401).send(
      <h2 style="color:red;font-family:sans-serif;text-align:center;margin-top:40px">
        ❌ Invalid credentials.{" "}
        <a href="/" style="color:#38bdf8">
          Try again
        </a>
      </h2>,
    );
  }

  const sessionId = generateSessionId();
  sessions[sessionId] = username;

  console.log(`[LEGITIMATE SERVER] ✅ Login successful for "${username}"`);
  console.log(`[LEGITIMATE SERVER] 🔑 Session ID issued: ${sessionId}`);

  res.setHeader("Set-Cookie", `session_id=${sessionId}; Path=/; SameSite=None`);

  res.redirect("/dashboard");
};
