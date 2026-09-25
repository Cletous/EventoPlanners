# EventoPlanners Milestone 14 - Manual System Testing Guide

## Objective
Validate the completed EventoPlanners functional workflows from the browser as a real administrator and attendee. Record the actual result, Pass/Fail status and any defect ID in `manual-system-test-cases.csv`.

## Test environment
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API base: http://localhost:3001/api
- Database: eventoplanners_db
- Browser: current Chrome/Edge
- Paynow: test-mode integration

## Recommended execution order
1. Authentication and authorization.
2. Administrator event creation and validation.
3. Attendee event browsing and registration.
4. Paynow initiation, abandoned-payment retry and polling.
5. Administrator registrations/payments views.
6. Dashboards and reports.
7. Security/role checks.
8. Production build regression.

## Evidence to capture
For the university report, capture evidence for representative tests rather than every click: terminal test output, Postman pass results, screenshots of registration/payment state transitions, admin filters, reports, and any failed test before/after its fix.

## Defect recording
When a case fails, give it a short defect ID such as `DEF-001`, record the observed result in the CSV, and preserve enough reproduction steps to repeat it in Milestone 17.
