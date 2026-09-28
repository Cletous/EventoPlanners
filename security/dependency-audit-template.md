# EventoPlanners Milestone 16 - Dependency Audit Evidence

Date tested: ____________________
Tester: ____________________

## Backend
Command:

```powershell
cd C:\Users\user\Desktop\EventoPlanners\backend
npm audit
```

Record:
- Total vulnerabilities: ____________________
- Critical: ____________________
- High: ____________________
- Moderate: ____________________
- Low: ____________________
- Notes / affected packages: ____________________

## Frontend
Command:

```powershell
cd C:\Users\user\Desktop\EventoPlanners\frontend
npm audit
```

Record:
- Total vulnerabilities: ____________________
- Critical: ____________________
- High: ____________________
- Moderate: ____________________
- Low: ____________________
- Notes / affected packages: ____________________

## Review decision
Do not automatically use `npm audit fix --force`.

For each relevant vulnerability, record whether it:
- affects runtime production code;
- affects development/testing tooling only;
- is reachable in EventoPlanners;
- requires a dependency upgrade;
- should be logged as a Milestone 17 defect.
