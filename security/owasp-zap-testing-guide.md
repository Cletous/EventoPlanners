# EventoPlanners Milestone 16 - OWASP ZAP Security Testing Guide

## Objective
Evaluate the local EventoPlanners application for common web security weaknesses using OWASP ZAP and focused manual tests while avoiding third-party Paynow systems.

## Test environment
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Test only the local EventoPlanners environment that you own/control.
- Do not direct ZAP at Paynow redirect, result, poll, or other third-party URLs.

## 1. Install OWASP ZAP on Windows
Recommended Windows installation:

```powershell
winget install --id=ZAP.ZAP -e
```

ZAP 2.17.0 is the current stable release at the time this milestone package was prepared. The Windows build requires Java 17 or newer.

After installation, open OWASP ZAP from the Start menu.

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
- http://localhost:3001/api/health
- http://localhost:5173

## 3. Create a fresh ZAP session
When ZAP starts, create a new session for EventoPlanners Milestone 16. Save it if you want the session as assessment evidence.

## 4. Passive reconnaissance first
Use ZAP Quick Start > Manual Explore.

Enter:

```text
http://localhost:5173
```

Launch the browser from ZAP. Browse the application normally so traffic passes through ZAP.

For the attendee role:
- login
- dashboard
- event listing/search
- event details
- registrations
- payment status pages, but do not continue into a real Paynow checkout during security scanning

For the administrator role, use a separate ZAP session if practical:
- login
- dashboard
- events
- registrations
- payments
- reports

Review the Alerts tab after passive browsing.

## 5. Automated scan of local frontend
From Quick Start > Automated Scan, target:

```text
http://localhost:5173
```

Use the modern/client/AJAX spider if available because the frontend is React/Vite.

Important: automated/active scanning can submit requests and mutate application data. Run it only against this disposable local test environment. If you want a lower-risk first pass, use Safe Mode and passive/manual exploration first.

## 6. Backend/API scan
Create another scan/session for:

```text
http://localhost:3001/api/health
```

Then manually proxy representative API traffic through ZAP. The API is JWT-protected, so an unauthenticated spider will not discover all protected endpoints automatically.

Do not active-scan these payment/provider paths:

```text
/api/payments/paynow/initiate
/api/payments/paynow/result
/api/payments/*/check
/api/admin/payments/*/check
```

These interact with payment workflow/provider state and are not needed for this coursework scan.

## 7. Authentication and authorization checks
Use ZAP Requester or Postman/manual browser checks to validate:
- protected endpoint without Authorization header returns 401
- malformed/invalid Bearer token returns 401
- normal attendee token on admin endpoint returns 403
- administrator token on admin endpoint succeeds
- attendee data remains scoped to the signed-in attendee

Useful endpoints:

```text
GET /api/auth/me
GET /api/user/dashboard
GET /api/registrations
GET /api/admin/check
GET /api/admin/dashboard
GET /api/admin/registrations
GET /api/admin/payments
GET /api/admin/reports
```

## 8. Input handling checks
Perform focused tests using test data only:
- invalid email/password on login
- duplicate registration/account rules
- event search text containing HTML/script-like characters
- malformed IDs such as non-numeric values where IDs are expected
- boundary values already defined by requirements, such as invalid event capacity

Do not attempt destructive SQL injection payloads against production systems. This milestone is for the local coursework environment only.

## 9. Security headers and CORS
Inspect responses in ZAP for:
- Access-Control-Allow-Origin
- Access-Control-Allow-Methods
- Access-Control-Allow-Headers
- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- frame protection (CSP frame-ancestors or X-Frame-Options)

Record ZAP alerts as observations first. Confirm whether each alert is genuinely applicable before logging it as a defect.

## 10. Sensitive data review
Verify that browser/API responses do not expose:
- password hashes
- JWT signing secret
- database credentials
- Paynow integration secret/key
- raw payment poll URL

Do not copy secrets into screenshots, reports, Postman environments, or submission documents.

## 11. Save evidence
Capture screenshots of:
- ZAP Sites tree
- Alerts summary
- at least one representative alert detail
- an authenticated request showing 401/403 behavior where applicable

Export a ZAP report if available, preferably HTML. Save it outside source control or under a local evidence folder.

## 12. Classifying findings
Use these coursework severity labels:
- Critical: direct compromise of authentication, authorization, payment integrity, or sensitive secrets
- High: serious exploitable security weakness with meaningful impact
- Medium: weakness requiring conditions or with limited impact
- Low: defense-in-depth/configuration issue with low direct impact
- Informational: observation, hardening recommendation, or scanner note

Only confirmed issues should become defects. False positives should be recorded as reviewed/not applicable rather than fixed blindly.

## 13. Milestone 16 acceptance
Milestone 16 is complete when:
- ZAP scan completes
- manual security cases are executed
- alert findings are reviewed
- confirmed findings are placed in security-findings-register.csv
- evidence screenshots/report are retained
- defects needing code changes are deferred into Milestone 17 for remediation and regression testing
