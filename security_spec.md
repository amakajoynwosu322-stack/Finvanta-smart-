# Security Specification: Vortex Capital

## 1. Data Invariants

1. **Identity & Ownership Invariant**:
   - A user cannot modify another user's profile, balance, investments, transactions, or notifications.
   - Any document created under a user's scope (`userId`) must have `userId == request.auth.uid`.
   - Users cannot arbitrarily elevate themselves to admin or change their own `role` / `balance` / `totalInvested` without authorized workflows.

2. **Temporal Integrity**:
   - Timestamps cannot be forged into the future or past arbitrarily; strings or timestamps adhere to valid ISO lengths and creation rules.

3. **Status Progression & Terminal State Locking**:
   - Transactions, Deposit Requests, and Withdrawal Requests in terminal states (`completed`, `rejected`, `approved`) cannot be reopened or mutated by standard users.

4. **Resource Constraints**:
   - Strings, arrays, and numbers are bound strictly (e.g. text sizes <= 1024 chars, numbers >= 0).
   - Document paths and IDs adhere to clean character sets (`^[a-zA-Z0-9_\\-]+$`).

5. **Master Gate / Admin Privilege Isolation**:
   - Administrative collections and operations (modifying global plans, changing platform config, approving/rejecting deposit & withdrawal requests) require verified membership in `/admins/{userId}` or matching bootstrapped admin email `amakajoynwosu322@gmail.com`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Ghost Privilege Escalation)**: Unauthenticated user attempts to write to `/admins/attacker_uid` with role: "superadmin".
2. **Payload 2 (Balance Inflation)**: Authenticated user `user_1` attempts to modify `/users/user_1` with `balance: 999999999`.
3. **Payload 3 (Impersonated Deposit)**: User `user_1` attempts to submit a `DepositRequest` with `userId: "user_2"`.
4. **Payload 4 (Terminal State Bypass)**: User `user_1` attempts to change a rejected `withdrawalRequests/w123` back to `status: "approved"`.
5. **Payload 5 (Junk ID Injection / Denial of Wallet)**: Attacker attempts to create a document at `/investmentPlans/` with a 2KB junk character ID.
6. **Payload 6 (Oversized Payload Flooding)**: User submits a Support Ticket with a 200KB message payload to exhaust storage.
7. **Payload 7 (Unverified Email Admin Spoof)**: Unverified email token claiming `amakajoynwosu322@gmail.com` attempts an admin mutation.
8. **Payload 8 (Foreign User List Scraping)**: User `user_1` queries `collection('transactions')` without scoping by `userId == user_1`.
9. **Payload 9 (Negative Investment Hijack)**: User submits an investment with negative amount (`amount: -5000`) to drain pool logic.
10. **Payload 10 (Plan Tampering)**: Standard user attempts to update daily ROI in `/investmentPlans/plan_quantum_alpha` to 100%.
11. **Payload 11 (Platform Config Overwrite)**: Standard user attempts to overwrite `/platformConfig/settings` with custom wallet addresses.
12. **Payload 12 (Referral Commission Counterfeit)**: User attempts to inject fake referral document `/referrals/ref_fake` with `commissionEarned: 50000`.
