# Security Specification: FINVANTA

## 1. Data Invariants

1. **Identity & Financial Field Tamper Invariant**:
   - A standard user cannot directly update their own `balance`, `totalInvested`, `totalEarned`, `totalWithdrawn`, or `totalDeposited`.
   - Modifying balances or executing payouts requires verified administrator authorization or server-side atomic stored procedures.
   - Non-admin profile updates are strictly constrained via `hasOnly(['displayName', 'photoURL', 'twoFactorEnabled', 'kycStatus', 'referredBy', 'updatedAt'])`.
   - User document creation enforces `balance == 0`, `totalInvested == 0`, `totalEarned == 0`, `totalWithdrawn == 0`, `totalDeposited == 0`, and `role == 'user'`.

2. **Transaction Integrity Invariant**:
   - Standard users cannot forge `completed` transactions.
   - User-initiated transactions can only be created with `status: 'pending'` for deposit or withdrawal requests.
   - Status updates on transactions can only be performed by administrators.

3. **Temporal Integrity**:
   - Timestamps adhere to ISO formats and server timestamp validation.

4. **Terminal State Locking**:
   - Deposit and withdrawal requests in terminal states (`approved`, `rejected`) cannot be altered by standard users.

5. **Master Gate / Admin Privilege Isolation**:
   - Administrative collections and operations (modifying plans, platform config, user suspension, approving deposits/withdrawals) require verified membership in `/admins/{userId}` or matching bootstrapped admin email `amakajoynwosu322@gmail.com`.

---

## 2. Hardened Security Verification Payloads

1. **Payload 1 (Ghost Balance Inflation)**: Standard user attempts an update on `/users/{uid}` with `balance: 50000`. Rejected by Firestore RLS & Supabase RLS.
2. **Payload 2 (Ghost Privilege Escalation)**: User attempts to modify `role: 'admin'`. Rejected.
3. **Payload 3 (Forged Completed Transaction)**: User attempts to insert a transaction with `type: 'deposit', status: 'completed'`. Rejected.
4. **Payload 4 (Terminal State Bypass)**: User attempts to update a rejected `withdrawalRequests/w123` back to `status: 'approved'`. Rejected.
5. **Payload 5 (Unauthenticated Admin Probe)**: Unauthenticated request to `/admins/` or `/platformConfig/settings`. Rejected.
6. **Payload 6 (Foreign User Profile Tampering)**: User A attempts to write to `/users/{userIdB}`. Rejected.
