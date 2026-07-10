# PubHunt — Security Audit

_Date: 2026-07-10 · Scope: full application (React/Vite SPA on GitHub Pages + Supabase backend)_

## Architecture in one paragraph

PubHunt is a purely client-side single-page app (no server of its own) deployed
as static files to GitHub Pages. All state and authorization live in Supabase,
reached directly from the browser with the public **anon** key. That means the
security boundary is **entirely** Supabase Row-Level Security (RLS) plus the
`SECURITY DEFINER` RPC functions. There is no server-side code path that can be
trusted. Anything the browser can send, an attacker can send. The findings below
are ordered by severity.

---

## CRITICAL

### C1 — Anonymous sign-in grants full admin read/write to the whole database

**Files:** `supabase/admin_passphrase.sql`, `src/pages/AdminLogin.tsx`, all
`supabase/*.sql` admin policies.

The admin RLS policies are all of this form:

```sql
create policy "admins full access to teams"
  on teams for all to authenticated using (true) with check (true);
```

The admin "login" flow is:

1. Client calls `verify_admin_passphrase(passphrase)` (a boolean check).
2. If true, client calls `supabase.auth.signInAnonymously()`.

The problem: the passphrase check and the sign-in are **two unrelated steps**.
`signInAnonymously()` produces a session whose Postgres role is `authenticated`.
The `using (true)` policies grant that role **full read/write on every table** —
teams, participants, and every answer/scoring table. Nothing ties the
authenticated session back to having passed the passphrase.

**Exploit (no passphrase needed):** any visitor opens the browser console and runs

```js
await supabase.auth.signInAnonymously();
await supabase.from('teams').select('*');        // every team + PLAINTEXT PIN
await supabase.from('participants').select('*'); // every participant's full name (PII)
await supabase.from('teams').update({ pin: '0000' }).eq('name', 'Rival');
await supabase.from('quiz_answers').update({ is_correct: true }).eq('team_id', myId);
await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
```

This is a complete bypass of the entire authorization model: reads all PINs and
PII, rewrites any team's score, and can wipe the whole dataset. The bcrypt-hashed
passphrase is effectively decorative because the gate it protects is not enforced
server-side.

**Fix:** the `authenticated` role must not be treated as "admin," because anon
sign-ins are authenticated too. Options, best first:

- **Preferred:** give real admins actual Supabase Auth accounts (email/password
  or magic link), turn **off** "Allow anonymous sign-ins," and scope admin
  policies to those users (e.g. an `admins` table keyed by `auth.uid()`, checked
  in the policy: `using (auth.uid() in (select user_id from admins))`).
- If you must keep the shared passphrase, do **not** use it to unlock an anon
  session. Instead have `verify_admin_passphrase` mint a short-lived signed token
  server-side, and gate admin writes through `SECURITY DEFINER` RPCs that verify
  that token — never via blanket `to authenticated` table policies.
- At minimum, change every admin policy to also require
  `(select auth.jwt() ->> 'is_anonymous')::boolean is not true`, so anonymous
  sessions are excluded. (This is a stopgap, not a real fix — see C1 preferred.)

---

## HIGH

### H1 — Team data is fully IDOR-able; team_id is the only "credential"

**Files:** `supabase/quiz.sql`, `photo_challenge.sql`, `anagram_challenge.sql`,
`console_challenge.sql`, `brain_training_challenge.sql`,
`missing_vowels_challenge.sql`, `team_clash_challenge.sql`.

Every team RPC is `grant execute ... to anon` and takes `p_team_id` **without
re-checking the PIN**. The SQL comments state this openly: _"trust the team_id
the client holds ... rather than re-verifying the PIN."_

Team IDs are not secret: `grant select (id, name, game_theme) on teams to anon`
lets any anon call `supabase.from('teams').select('id,name')` and enumerate every
team's UUID; `get_clash_targets()` also returns them. So an attacker can, with no
login at all:

- **Read any team's answers:** `get_team_quiz_answers(victimId)`,
  `get_team_photo_answers(victimId)`, etc.
- **Overwrite/griefe any team's answers:** `submit_quiz_answer(victimId, ...)`.
  Because each submit resets `is_correct = null`, an attacker can silently wipe a
  rival's already-marked (scored) answers right before results.

**Fix:** the RPCs must authenticate the caller as that team. Pass the PIN (or a
server-issued session token) into each RPC and verify it inside the
`SECURITY DEFINER` body before reading/writing, e.g.:

```sql
where team_id = p_team_id
  and exists (select 1 from teams t where t.id = p_team_id and t.pin = p_pin)
```

Better: on PIN login, issue an opaque per-team session token (random, stored
server-side with an expiry), hand it to the client, and require it on every RPC.
Then team_id alone is useless to an attacker.

### H2 — Team PINs are 4-digit, plaintext, and brute-forceable

**Files:** `supabase/schema.sql` (`pin text not null`, `verify_team_pin`).

- Stored in **plaintext** (`teams.pin`), so C1 exposes them directly, and anyone
  with SQL/dashboard access sees them.
- **4 numeric digits = 10,000 combinations**, and `verify_team_pin` has **no rate
  limiting or lockout**. A script can try all PINs for a team in seconds and log
  in as any team.

**Fix:**

- Store a hash, not the PIN: `pin_hash text` with `crypt(pin, gen_salt('bf'))`,
  compare with `crypt(p_pin, pin_hash)` inside `verify_team_pin`.
- Add rate limiting: track failed attempts per team (and/or per IP via an edge
  function) and lock out after N failures. Supabase alone can't see client IPs,
  so consider fronting login with an edge function or a `login_attempts` table
  with a cooldown.
- Consider longer PINs (6+ digits) or alphanumeric codes; 4 digits is weak even
  with rate limiting.

---

## MEDIUM

### M1 — All quiz answers ship to every browser in the JS bundle

**Files:** `src/pages/quiz.ts` (`ROUTE_QUIZ_ANSWERS`), imported by
`src/pages/AdminMarkingPage.tsx`, which is statically imported by
`AdminDashboard.tsx`. There is **no code splitting / `React.lazy`** anywhere, so
the admin marking page — and the answer key it imports — is compiled into the
single JS bundle served to **all** visitors.

Any competitor can open DevTools (or read the built `assets/*.js`) and extract
`ROUTE_QUIZ_ANSWERS` for both routes, defeating the quiz. The `data/quiz-answers.md`
file is not bundled (it lives in `/data` and isn't imported), but `quiz.ts` is.

**Fix:** answers must not live in client code. Keep them server-side (a table
only admins can read, or inside the marking RPC) and have the admin marking page
fetch them at runtime through an admin-only RPC. As a weaker interim step, at
least lazy-load the admin bundle so it isn't in the default chunk — but that only
raises the bar slightly; the real fix is to keep answers off the client entirely.

### M2 — No rate limiting on `verify_admin_passphrase`

**File:** `supabase/admin_passphrase.sql`. The RPC is `grant execute ... to anon`
with no throttling. Even once C1 is fixed, an unauthenticated attacker can
brute-force the shared passphrase offline-style (online, but unlimited attempts).
bcrypt slows this but a weak/guessable passphrase still falls. **Fix:** enforce a
strong passphrase, add attempt throttling, and prefer per-admin accounts (see C1).

### M3 — Team session (incl. PIN) persisted in localStorage

**File:** `src/App.tsx` — the full `TeamSession`, **including the plaintext PIN**
(`TeamLogin.tsx` puts `pin: pin.trim()` into the session), is written to
`localStorage.pubhunt_team_session`. Any XSS, malicious browser extension, or
shared/kiosk device leaks the PIN and the whole roster. **Fix:** don't store the
PIN client-side after login. Store only a team id + opaque session token (see H1),
and prefer a `sessionStorage` or httpOnly-cookie-style model where feasible.

---

## LOW / INFORMATIONAL

- **L1 — Anon key in the bundle is expected, not a finding by itself.** The
  Supabase anon key is designed to be public; RLS is the real boundary. Flagged
  only to emphasize that _all_ security rests on RLS being correct — which,
  per C1/H1, it currently isn't.
- **L2 — CSP is present and reasonably tight** (`default-src 'self'`, no
  `unsafe-inline` on `script-src`). Good. Minor: `style-src` allows
  `'unsafe-inline'` (needed for the many inline `style={{…}}` props) — acceptable
  but worth noting it weakens CSP against style-based injection. Consider moving
  inline styles to classes over time.
- **L3 — `data/quiz-answers.md` and `src/pages/quiz.ts` answer keys are committed
  to a repo** whose deployed site is public. The repo itself may be public too —
  confirm repo visibility; if public, the answer key is trivially readable
  regardless of M1.
- **L4 — Good practices observed:** RLS enabled on all tables; `SECURITY DEFINER`
  functions pin `search_path` (prevents search-path hijacking); bcrypt for the
  passphrase; secrets injected via GitHub Actions `secrets.*` at build time;
  `.gitignore` excludes `.env.local` and the PII file `src/pubhunt.txt`;
  `security.txt` and a disclosure contact are published.
- **L5 — `maximum-scale=1.0, user-scalable=no`** in the viewport meta is an
  accessibility problem (blocks zoom), not security — noting while here.
- **L6 — Dependency hygiene:** run `npm audit` in CI and keep
  `@supabase/supabase-js` current. Not audited live here; add it to the pipeline.

---

## Priority order for remediation

1. **C1** — rebuild admin auth so anonymous sessions are not admins. Nothing else
   matters until this is closed; today the database is world-writable.
2. **H1 / H2** — authenticate team RPCs (token or PIN check) and hash + rate-limit
   PINs. Closes cross-team read/tamper and PIN brute force.
3. **M1** — move the quiz answer key off the client.
4. **M2 / M3** — throttle passphrase attempts; stop persisting the PIN.
5. **Low items** as cleanup.
