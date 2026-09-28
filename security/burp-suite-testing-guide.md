# EventoPlanners Milestone 16 - Burp Suite Community Edition Security Testing Guide

## Objective
Evaluate the local EventoPlanners application for common web security weaknesses using Burp Suite Community Edition, focused manual API tests, and dependency audits.

The purpose is to create repeatable HSE412 security-testing evidence, not to perform destructive exploitation.

## Test environment
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`
- Test only the local EventoPlanners environment that you own/control.
- Do not target Paynow or any other third-party system.

## 1. Install Burp Suite Community Edition
Download Burp Suite Community Edition/Desktop from the official PortSwigger website and run the Windows installer.

When Burp starts:
1. Choose a temporary project unless you specifically want to save a Burp project.
2. Use the default Burp configuration.
3. Click **Start Burp**.

Burp Community Edition is suitable for this milestone because Proxy and Repeater allow controlled manual testing of requests and responses. The full automated vulnerability scanner is a Professional feature, so this milestone uses manual security cases rather than claiming an automated Burp vulnerability scan.

## 2. Start EventoPlanners
Backend:

```powershell
cd C:\Users\user\Desktop\EventoPlanners\backend
npm run dev
```

Frontend in another PowerShell window:

```powershell
cd C:\Users\user\Desktop\EventoPlanners\frontend
npm run dev
```

Confirm:
- `http://localhost:3001/api/health`
- `http://localhost:5173`

## 3. Open EventoPlanners through Burp's browser
In Burp:
1. Open **Proxy**.
2. Choose **Open browser**.
3. In the Burp browser, open `http://localhost:5173`.
4. Keep **Intercept is off** during normal browsing unless you specifically need to modify a request.
5. Use **Proxy > HTTP history** to inspect captured traffic.

Burp's embedded browser is already configured to use Burp as its proxy, making it the easiest option for this coursework.

## 4. Browse the attendee workflow
Use a normal attendee account and visit:
- login;
- attendee dashboard;
- events;
- event search;
- event details;
- registrations;
- payment-status pages.

Do not continue to an external Paynow checkout while testing.

In **HTTP history**, identify representative requests such as:

```text
POST /api/auth/login
GET /api/auth/me
GET /api/events
GET /api/user/dashboard
GET /api/registrations
```

Take a screenshot showing the HTTP history with EventoPlanners requests. Avoid exposing the full bearer token in submitted evidence.

## 5. Browse the administrator workflow
Log out and sign in with an administrator test account. Browse:
- administrator dashboard;
- event management;
- registrations;
- payments;
- reports.

Representative endpoints include:

```text
GET /api/admin/check
GET /api/admin/dashboard
GET /api/admin/events
GET /api/admin/registrations
GET /api/admin/payments
GET /api/admin/reports
```

## 6. Use Repeater for authentication tests
For a protected request in HTTP history:
1. Right-click the request.
2. Select **Send to Repeater**.
3. Open **Repeater**.
4. Modify only the item required by the test.
5. Click **Send**.
6. Record the status code and relevant response message.

### Test A - no bearer token
Remove the `Authorization` header from a protected request.

Expected:

```text
HTTP 401
```

No protected information should be returned.

### Test B - invalid bearer token
Use:

```text
Authorization: Bearer invalid-token
```

Expected: `401`.

### Test C - attendee token against administrator route
Capture an attendee-authenticated request, then use the attendee bearer token on:

```text
GET /api/admin/check
```

Expected: `403`.

This is one of the most important Milestone 16 screenshots because it demonstrates server-side role enforcement.

## 7. Test horizontal access control / IDOR safely
EventoPlanners must prevent one attendee from accessing another attendee's protected records.

Use two test attendee accounts where practical.

Suggested method:
1. Log in as attendee A and capture registration/payment requests.
2. Note a resource identifier owned by attendee A.
3. Log in as attendee B.
4. Send the relevant request to Repeater.
5. Replace the identifier with attendee A's identifier.
6. Confirm attendee B cannot retrieve or modify attendee A's protected data.

Do not create or alter real payment-provider data for this test.

## 8. Input-handling tests
Use safe test strings only in your local environment.

### Search/XSS-style text
Try an event search containing:

```text
<script>alert(1)</script>
```

Expected:
- it is treated as data;
- no JavaScript executes;
- no uncontrolled HTML injection appears.

### Malformed IDs
For a request expecting a numeric identifier, test a value such as:

```text
abc
```

Expected:
- controlled `4xx` behavior;
- no stack trace;
- no SQL/database details.

### SQL-injection-style validation check
For a text/search input, a harmless string such as:

```text
' OR '1'='1
```

may be used only to confirm it is handled as ordinary input. Do not perform destructive payloads or database modification attempts.

## 9. CORS review
Inspect backend API response headers in Burp.

The local application is expected to restrict browser CORS access to the frontend origin rather than using a wildcard for authenticated application traffic.

Record:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

If practical, send a Repeater request with an unexpected `Origin`, for example:

```text
Origin: http://example.invalid
```

Record actual behavior. Do not automatically classify a CORS observation as exploitable without reviewing the response.

## 10. Security header review
Inspect representative frontend and API responses for:
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- frame protection through `X-Frame-Options` or CSP `frame-ancestors`.

Missing defensive headers can be recorded as Low/Medium hardening findings depending on context, but they should not be described as direct compromise unless exploitation is demonstrated.

## 11. Sensitive data review
Inspect responses and browser traffic for accidental exposure of:
- password hashes;
- plaintext passwords;
- JWT signing secret;
- database credentials;
- Paynow integration secret/key;
- raw `poll_url` values;
- stack traces or filesystem paths.

Do not put actual bearer tokens or secrets into screenshots, reports, or the findings register.

## 12. Payment callback integrity test
The Paynow callback endpoint can be tested locally only with an intentionally invalid callback payload/hash.

Target:

```text
POST /api/payments/paynow/result
```

Expected:
- invalid hash is rejected with `400`;
- no payment becomes paid;
- no registration becomes confirmed.

Do not attempt to derive, guess, or expose the real provider key.

## 13. Do not attack external Paynow services
Do not use Burp Intruder, Repeater automation, scanners, or other tooling against external Paynow hosts.

Avoid active experimentation that triggers provider calls through:

```text
/api/payments/paynow/initiate
/api/payments/*/check
/api/admin/payments/*/check
```

Those endpoints are not required to demonstrate the core Milestone 16 security objectives.

## 14. Dependency vulnerability audit
Run npm's dependency audit for both applications.

Backend:

```powershell
cd C:\Users\user\Desktop\EventoPlanners\backend
npm audit
```

Frontend:

```powershell
cd C:\Users\user\Desktop\EventoPlanners\frontend
npm audit
```

Copy the summary into `security/dependency-audit-template.md` or retain screenshots. Do not run `npm audit fix --force` automatically. Any dependency change should be reviewed and tested as a deliberate Milestone 17 fix.

## 15. Capturing evidence
Recommended screenshots:
1. Burp Proxy HTTP history showing EventoPlanners traffic.
2. Repeater - protected route with Authorization removed returning 401.
3. Repeater - invalid token returning 401.
4. Repeater - attendee token against `/api/admin/check` returning 403.
5. Representative response headers.
6. Safe script-like input being treated as text.
7. `npm audit` summaries for frontend and backend.

Redact bearer tokens and any secrets before submission.

## 16. Finding classification
Use these coursework labels:
- **Critical** - direct compromise of authentication, authorization, payment integrity, or sensitive secrets.
- **High** - serious exploitable weakness with meaningful impact.
- **Medium** - weakness requiring conditions or having limited impact.
- **Low** - defense-in-depth/configuration weakness with low direct impact.
- **Informational** - observation or improvement recommendation.

Only confirmed issues should receive a defect ID. A test result that behaves as expected is not a vulnerability.

## 17. Milestone 16 acceptance
Milestone 16 is complete when:
- Burp Proxy has captured attendee and administrator traffic;
- authentication and authorization tests have been executed in Repeater;
- data-isolation tests have been completed;
- input/error/header/CORS checks have been recorded;
- invalid payment callback hash behavior has been checked;
- frontend and backend dependency audits have been recorded;
- all manual test cases have an Actual Result and Status;
- confirmed findings are entered in `security-findings-register.csv`;
- code changes, if required, are deferred to Milestone 17 Defect Management and Regression Testing.
