const sessions = require("../db/sessions");

exports.getDashboard = (req, res) => {
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
};

exports.getProfile = (req, res) => {
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
};
