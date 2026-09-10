# Plan: Show the lock reason to a locked client at login

## Problem
When an admin/agent locks an account and writes a lock reason, the client who tries to log in with the *correct* password sees the generic toast "Credenziali non valide" ("Invalid credentials"). The client thinks their password is wrong. The lock reason that the admin typed is never shown.

## What will change

1. **Login response for locked accounts**
   - When the email and password are correct but the account status is `locked`, the login will no longer be reported as "invalid credentials".
   - It will return a dedicated "account locked" response that carries the exact lock reason text the admin/agent typed.
   - If the password is actually wrong, the client still gets "Credenziali non valide" (nothing changes there). The lock reason is only revealed after a correct password, so it cannot be used to probe accounts.

2. **Login page (client side)**
   - Instead of the small toast in the corner, a prominent red alert box appears inside the login card, under the form fields:
     - Title: **"Account bloccato"** (IT) / **"Account locked"** (EN)
     - Body: the admin's lock reason, shown verbatim.
   - If the admin locked the account without typing a reason, a default message is shown: "Il tuo account è stato bloccato. Contatta l'assistenza." / "Your account has been locked. Please contact support."
   - The alert stays visible until the client edits the form or submits again.

3. **Already-logged-in clients**
   - If an account is locked while the client has an open session, their next request will be rejected with the same "account locked" message and they are sent back to the login page where the lock reason is displayed. (Today they would just get a silent logout / generic error.)

## Out of scope
- No change to how admins/agents lock accounts or write the reason (the existing lock reason field is reused as-is).
- No change to frozen accounts: frozen clients continue to log in and see the freeze banner inside the wallet, as today.
- No email notification on lock.

## Assumptions (push back if wrong)
- The lock reason typed by the admin is intended to be shown to the client word-for-word (it is not internal-only text).
- Showing the message inline in the login card (not a toast) is preferred, since a toast disappears and is easy to miss.
- Accounts with status `closed` are left as they are today; only `locked` gets the new behaviour.
