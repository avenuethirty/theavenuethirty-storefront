# Hosted maintenance verification

Verified on 5 October 2026 against the approved development database.

- Health endpoint: https://the-avenue-thirty-maintenance.onrender.com/healthz
- Returned `status: ok`, `maintenanceEnabled: true`, `verifiedDatabaseTls: true`, and `developmentOnly: true`.
- Created fictitious development order `DEV-100102` without an email address.
- Changed only that order's active reservation deadline to the past.
- Observed the hosted worker cancel it with `confirmation_timeout`, release its reservation, and record exactly one `reservation_expired` event. No local expiry command was called.
- Type checking passed.

The repeatable verification script is `directus/verify-hosted-maintenance.ts`. Its private retry state is kept in the ignored `.local` directory. Failed verification attempts cancel their own test order during cleanup.

Render free service sleeping means the 60-second interval runs only while the process is awake. This deployment is suitable for development acceptance, but does not guarantee timely inventory release in production. Production scheduling or an always-running worker remains a launch requirement.
