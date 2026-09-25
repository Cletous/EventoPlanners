# EventoPlanners Milestone 15 - Performance Testing Guide

## Purpose

This milestone uses Apache JMeter to measure how the EventoPlanners backend behaves as concurrent user load increases.

The supplied plan is intentionally read-only after authentication. Each virtual user logs in once and then repeatedly performs:

1. `GET /api/health`
2. `GET /api/events`
3. `GET /api/user/dashboard`

This avoids creating registrations, payments, or other permanent test data during a load test.

## Prerequisites

- MySQL running.
- EventoPlanners backend running at `http://localhost:3001`.
- A normal attendee account that already exists in EventoPlanners.
- Apache JMeter 5.6.x installed.
- `jmeter` available in PowerShell PATH, or provide the full command path to the runner script.

Do not use an administrator account for the supplied test plan because `/api/events` and `/api/user/dashboard` require the normal `user` role.

## Confirm the backend first

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

The request must succeed before performance testing begins.

## Optional GUI smoke test

Open the plan in JMeter GUI:

```powershell
jmeter
```

Then open:

`performance\EventoPlanners_Milestone15_Performance_Test.jmx`

For a quick GUI run, set properties on the command line instead of editing credentials into the file:

```powershell
jmeter -t .\performance\EventoPlanners_Milestone15_Performance_Test.jmx -JtestEmail="your-user@example.com" -JtestPassword="your-password" -Jthreads=1 -JrampUp=1 -Jloops=1
```

The GUI is useful for debugging only. Use non-GUI mode for measured performance tests.

## Recommended automated run

From the EventoPlanners project root:

```powershell
.\performance\run-performance-tests.ps1 `
  -TestEmail "your-user@example.com" `
  -TestPassword "your-password"
```

The script runs three tiers:

| Tier | Virtual users | Ramp-up | Loops per user | Purpose |
| --- | ---: | ---: | ---: | --- |
| Baseline | 5 | 5 seconds | 5 | Establish normal local response times |
| Load | 25 | 25 seconds | 10 | Observe expected concurrent load |
| Stress | 75 | 60 seconds | 10 | Observe degradation and stability under heavier load |

Each virtual user logs in once, so the test also measures concurrent authentication setup without repeatedly hashing passwords on every request loop.

## Output

The runner creates:

```text
performance\results\baseline.jtl
performance\results\baseline\index.html
performance\results\load.jtl
performance\results\load\index.html
performance\results\stress.jtl
performance\results\stress\index.html
```

Open each `index.html` in a browser.

## Metrics to record

For each tier, capture:

- Total samples
- Error percentage
- Average response time
- Median response time
- 90th percentile
- 95th percentile
- 99th percentile
- Throughput (requests/second)
- Maximum response time

Also note CPU/RAM usage on the test machine if available.

## Suggested evaluation criteria

Because this milestone runs on a local development machine, treat these as project targets rather than production SLAs:

- No unexpected HTTP errors at baseline or normal load.
- Error rate should ideally remain 0% at baseline and load.
- 95th percentile response time should preferably remain below 2 seconds at normal load.
- Stress testing may show slower responses; record the point where response times or errors increase sharply.
- The backend should recover after the stress test and `/api/health` should succeed afterward.

Do not hide a poor result. The purpose of performance testing is to measure the system and identify its limits.

## Fair-test rules

- Run all three tiers on the same machine and network conditions.
- Close unrelated heavy applications when possible.
- Use the same database state for comparisons.
- Do not run JMeter GUI for the final measurements.
- Do not run load tests against Paynow or any external payment provider.
- Do not run the stress test against a server you do not own or have permission to test.

## Interpreting failures

### Login failures

If `POST Login` fails, confirm the supplied attendee email/password and that the account role is `user`.

### 401 on event/dashboard requests

The JWT extraction probably failed because login failed. Fix login first rather than changing the Authorization header.

### Connection refused

The backend is not running or the host/port is wrong.

### 500/503 responses

Check the backend console and MySQL. A 503 from `/api/health` indicates the API process is reachable but the database dependency is unavailable.

## After the test

Run:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Then perform a normal browser login and event browse check to confirm the application recovered cleanly.
