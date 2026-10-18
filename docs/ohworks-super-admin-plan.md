# OOHWORKS super admin: plan

Date: 18 Oct 2026. Status: step 1 is built (section 12); steps 2 to 6 are planned and not started. Builds on the Payload admin at `/admin`, which `ohworks-architecture.md` already names as the ops console, and on the team review of owner sites built in List your sites step 1. Production is Google Cloud Run with secrets in Secret Manager; the Netlify preview has been removed.

## 1. What this must achieve

OOHWORKS needs one level of control above everyone else: someone who decides who works on the platform, what each person may do, and how the platform behaves, who can publish to the website, and who can stop anything that goes wrong.

**The promise to the founders:** nobody can sign in to run OOHWORKS unless a super admin put them there, every action the team takes is recorded and cannot be erased, and there is always a way back in.

**The test this must pass:** a fresh production database is released, a named super admin signs in with the password from the secret store, is made to change it, publishes an article, adds an editor, suspends a spam owner, closes owner sign-ups for an hour, and every one of those steps appears in the audit log with who did it and when.

## 2. Where things stood before step 1

| Part                  | Before                                                                     | Problem                                                                  |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Team accounts         | Payload `users` collection, roles admin, editor, writer, contributor, ops  | No role above admin; nothing stopped the last admin being removed        |
| How accounts are made | `seed.ts` created `admin@`, `editor@` and `writer@ohworks.local` on every database, production included | Production would get three shared demo accounts                          |
| Production password   | `SEED_ADMIN_PASSWORD`, written into all three accounts on every release, and printed at the end of the seed | A password changed in the admin was overwritten, and the password reached the release log |
| Sign-in safety        | Payload defaults                                                           | No lockout tuned for staff, long sessions, no second step                |
| Suspending someone    | Only deleting them                                                         | Deleting loses who did what                                              |
| Publishing            | Admins and editors                                                         | No role above them to publish                                            |
| Owners                | Can be locked by wrong passwords; no suspend                               | A bad owner's sites stay live until each is unpublished by hand          |
| Record of actions     | None                                                                       | No answer to "who changed this price?"                                   |
| Platform switches     | None; behaviour lives in environment variables                             | Closing sign-ups needs a release                                         |

## 3. Decisions

1. **The console stays inside the Payload admin.** It already has sign-in, lists, filters, forms and per-role access on all 21 collections. A separate console would rebuild all of that. What Payload lacks (a home page of queues, owner actions, settings) is added as custom admin views.
2. **A new role, `superadmin`, sits above `admin`.** Admin keeps running the marketplace day to day. Super admin alone controls people, settings, permanent deletion and the audit log, and can do everything an admin or editor can, including publishing.
3. **Team logins are seeded, never signed up.** There is no sign-up page for staff. Accounts come from lists held in the secret store and written into the database by the seed on every release (section 5). After that, a super admin can add people from the console.
4. **Nothing about the team is committed.** The repository is public, so names, emails and passwords live only in the secret store: Google Secret Manager on Cloud Run, `.env` on a development machine.
5. **Suspend instead of delete.** Team members and owners are suspended, which takes effect on their next request. Deleting a person is a separate, super-admin-only privacy action.
6. **Three super admins from the start.** The founders named three addresses (kept in the secret store and the local `.env`, not here), so one person losing access never locks OOHWORKS out.

## 4. Roles and what each may do

| Area                                                                  | Super admin | Admin         | Editor      | Ops         | Writer, contributor |
| --------------------------------------------------------------------- | ----------- | ------------- | ----------- | ----------- | ------------------- |
| Team accounts: add, suspend, reset, change role                       | Yes         | No            | No          | No          | No                  |
| Grant or remove super admin                                           | Yes         | No            | No          | No          | No                  |
| **Publish articles, blogs, guides and reports to the website**        | Yes         | Yes           | Yes         | No          | Draft only          |
| Edit or unpublish any piece                                           | Yes         | Yes           | Yes         | No          | Own drafts          |
| Platform settings                                                     | Yes         | Read          | No          | No          | No                  |
| Audit log                                                             | Read        | Read own area | No          | No          | No                  |
| Delete anything permanently                                           | Yes         | No            | No          | No          | No                  |
| Owners: verify, suspend, unlock, send reset link                      | Yes         | Yes           | No          | Verify only | No                  |
| Sites: approve, return, unpublish, take down                          | Yes         | Yes           | Yes         | Yes         | No                  |
| Enquiries: read threads, mark spam, block a sender                    | Yes         | Yes           | No          | Read        | No                  |
| Outbox (emails not sent)                                              | Yes         | Yes           | No          | No          | No                  |
| Media and tags                                                        | Yes         | Yes           | Yes         | Yes         | Upload only         |

Publishing keeps the fact-check gate for everyone, super admins included: every Fact in a piece must be ticked against its source and the piece marked fact-checked before it goes live. A super admin can tick the facts and mark the piece themselves.

Rules no one can break, enforced in hooks on `users`, not in the screens:

- There is always at least one active super admin. The last one cannot be suspended, demoted or deleted.
- Only a super admin can make someone a super admin.
- Nobody can change their own role, suspend themselves or delete their own account.
- Every access rule checks that the person is active, so a suspension works on the next request; it also ends their sessions at once.
- Someone holding a password they were given can do nothing but replace it.

## 5. Seeding the logins

### What is seeded

| Account                                            | Comes from                                                             | Password                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| The super admins                                   | `SUPER_ADMIN_EMAILS`, comma-separated                                  | `SUPER_ADMIN_PASSWORD`; each must change it at first sign-in                   |
| The rest of the team                               | `TEAM_ACCOUNTS`, a JSON list of `{ "email", "name", "role" }`          | None they can use; a super admin sets a first one (emailed links come in step 4) |
| Demo accounts (development and test machines only) | Fixed in `team-accounts.ts`: one per role at `@ohworks.local`          | `ohworks-admin-local`                                                          |

A super admin's name starts as their initials or the words of their address (`vc@` becomes "VC"); they can change it in the admin. On a development machine `SUPER_ADMIN_PASSWORD` may be left out, and new super admins start with the local password, which they must change.

Example of `TEAM_ACCOUNTS` as it would sit in the secret store:

```json
[
  { "email": "ops@example.com", "name": "Ops lead", "role": "admin" },
  { "email": "desk@example.com", "name": "News desk", "role": "editor" }
]
```

### How the seed behaves

It runs on every release, straight after `payload migrate`, in `scripts/release.mjs` (the Cloud Run release job), and on every local seed. It is safe to run any number of times.

1. **The super admins.** Find each by email. If missing, create with role `superadmin`, the password from the secret, and `mustChangePassword` on. If present, make sure the role is still `superadmin` and the account is active. **Never touch a password that already exists.**
2. **The team list.** Create anyone missing, with a random password nobody knows. If their role in the list changed, update it, unless that would remove the last super admin. Someone taken off the list is not deleted; the seed names them in its summary so a super admin can suspend them in the console, where the audit log records it.
3. **Demo accounts** are created only when `NODE_ENV` is not `production`. Production never has an `@ohworks.local` account.
4. **Never no one.** If the database would be left with no active super admin, the seed stops and the release with it, saying which settings to add. An empty user table would let the first visitor to `/admin` create an account.
5. **Summary.** The seed prints created, updated and unchanged accounts. It never prints a password.

### Getting back in

If no super admin can sign in, set `SUPER_ADMIN_RESET=1` and a new `SUPER_ADMIN_PASSWORD` for one release. The seed puts that password on every listed super admin, lifts any lockout and turns `mustChangePassword` on. Remove the flag before the next release.

## 6. Signing in safely

| Measure                      | How                                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lock after wrong passwords   | Payload `auth.maxLoginAttempts: 5`, `lockTime` 15 minutes; a super admin can unlock early                                                                                                     |
| Short sessions               | Staff session ends after 8 hours                                                                                                                                                              |
| Strong passwords             | At least 12 characters, checked in a `beforeChange` hook                                                                                                                                      |
| Change the given password    | While `mustChangePassword` is on, the access rules refuse everything but their own account, and the admin shows only the account page with a notice                                         |
| A second step for production | Cloudflare Access in front of `/admin` when production moves behind Cloudflare: a one-time code to an allowed email before the admin page even loads. Free for up to 50 people.               |
| Suspended means out          | `active` checked on every request, sessions cleared, and Payload's `beforeLogin` hook                                                                                                        |
| Every sign-in recorded       | `lastSignInAt` on the account now; success and failure, with time and IP, in the audit log in step 2                                                                                          |

## 7. What the super admin controls

### Home: what needs attention

A custom dashboard replaces Payload's default home for super admins and admins:

- **Queues:** sites in review, pieces waiting to be published, owners waiting for verification, enquiries with no owner reply after 48 hours, enquiries marked as possible spam, emails sitting in the Outbox, locked accounts.
- **Counts:** owners, live sites, published pieces, enquiries this week, new owners this week.
- **Recent actions:** the last 20 audit rows.

Each item links straight to the filtered list in the admin.

### Team

List of staff with role, active or suspended, last sign-in. Actions: add, change role, suspend, restore, set a first password, unlock. All recorded.

### Articles and blogs

A super admin writes, edits, publishes and unpublishes any piece in the Newsroom (articles, guides, reports and newsletter issues), with the same fact-check gate as an editor. Publishing refreshes the home page and tells search engines through IndexNow, as it does for editors.

### Owners

Added to each owner's page in the admin: **Verify**, **Suspend** (with a reason the owner is shown), **Restore**, **Unlock sign-in**, **Send a set-password link**. Suspending an owner blocks their sign-in, hides all their sites from search and site pages, and stops new enquiries reaching them. Restoring brings the sites back as they were.

### Sites

The review states built in List your sites step 1 stay. Added: **Take down** with a reason, for a site that is live and should not be, and bulk approve or return from the list.

### Buyers and enquiries

Buyers have no accounts, so control is by sender. A new `blocked-senders` collection holds an email address or a whole domain, with a reason. The enquiry route refuses a blocked sender with the same message as a busy form, so a spammer learns nothing. Any enquiry can be marked as spam, which hides it from the owner.

### Platform settings

A Payload global, `platform-settings`, that only a super admin can change:

| Setting                   | Effect                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| Notice across the site    | A one-line banner, for planned work or an outage                           |
| Owner sign-ups open       | When off, the List your sites start page says sign-ups are paused          |
| Enquiries open            | When off, enquiry forms say enquiries are paused and nothing is sent       |
| Claude search reading     | Switches the second reading of searches on or off without removing the key |
| Hub thresholds            | The 10 and 25 sites a hub needs before it shows and before it is indexed   |
| Email sender and reply-to | The name and address on every email                                        |

Each change is recorded with the old and new value.

### Audit log

A collection, `audit-log`, written by hooks on every collection and by the actions above. Each row: who, what (collection, document, action), when, the fields that changed with old and new values, and IP. Nobody can edit or delete a row, not even a super admin. Rows are kept for a year.

### Privacy requests

India's DPDP Act gives people the right to have their data erased. A super-admin-only action finds everything held about one email address (owner record, enquiries, messages, subscriptions), shows it, and erases it or exports it. The audit row records that it happened, not what was erased.

## 8. What must exist to build it

| Change                                                                                                  | Kind                                        | State          |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------- |
| `users`: `superadmin` role, `active`, `mustChangePassword`, `lastSignInAt`; auth settings               | Collection change and migration             | Built (step 1) |
| Access helpers: `isSuperAdmin`, `canPublish`, and the active and given-password checks in every helper  | Code                                        | Built (step 1) |
| Guards on `users`: last super admin, self-change, who may grant, password length                        | Hooks                                       | Built (step 1) |
| `seed-team.ts` and `team-accounts.ts`, called by the seed on every release                              | Script                                      | Built (step 1) |
| Change-password screen                                                                                  | Custom admin component                      | Built (step 1) |
| `owners`: `status` (active, suspended), `suspendedReason`, `suspendedAt`; public queries skip suspended | Collection change and migration             | Step 3         |
| `audit-log` collection and the hooks that write it                                                      | New collection and migration                | Step 2         |
| `blocked-senders` collection; checked in `/api/enquire`                                                 | New collection and migration                | Step 3         |
| `platform-settings` global, read by the site                                                            | New global and migration                    | Step 2         |
| Dashboard view, owner action buttons                                                                    | Custom admin components                     | Step 3         |
| Payload's email sent through Resend (`@payloadcms/email-resend`) for set-password links                 | Package and config; needs `RESEND_API_KEY`  | Step 4         |
| Cloudflare Access on `/admin`                                                                           | Production setup, at the move to Cloud Run  | Step 6         |

Every collection change ships with a committed Payload migration, and CI proves the migrations by releasing to an empty database.

## 9. Build order

| Step | What                                                                                                   | Days       | Done when                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Role, active flag, guards, publishing for super admins, team seed, sign-in settings, change-password screen | 2 to 3     | Done 18 Oct 2026 (section 12)                                                                                                                      |
| 2    | Audit log and platform settings                                                                        | 2 to 3     | Every change made in step 3 shows in the log; closing sign-ups works without a release                                                            |
| 3    | Dashboard, owner suspend and restore, blocked senders, take down                                       | 3 to 4     | The test in section 1 passes, apart from emailed links                                                                                            |
| 4    | Set-password emails through Resend                                                                     | 1          | A seeded team member signs in from their link (needs the Resend key)                                                                              |
| 5    | Privacy requests, data export                                                                          | 2          | One email's data can be found, exported and erased                                                                                                |
| 6    | Cloudflare Access on `/admin`                                                                          | Half a day | Part of the production move                                                                                                                       |

## 10. Checks

- `verify.ts` (`pnpm --filter @ohworks/web verify:cms`, on the test database) has a team section; see section 12 for what it proves.
- `team-accounts.test.ts` (`pnpm test`) covers the access helpers and the reading of every setting, including each wrong one.
- Still to add with step 3: Playwright, where the super admin signs in and is made to change the password, the dashboard shows the queues, a writer does not see Team or Settings, a suspended owner's site page returns 404 and the enquiry form refuses a blocked sender.

## 11. Decisions for you

| Question                                                                         | Answer or default                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Who are the first super admins?                                                  | Answered 18 Oct 2026: three addresses, held outside the repository |
| A backup super admin?                                                            | Answered: three, so one losing access never locks OOHWORKS out     |
| Who else goes in `TEAM_ACCOUNTS`, with which role?                               | Nobody yet; the super admins add people from the console          |
| Second step at sign-in: Cloudflare Access, or an authenticator app in the admin? | Cloudflare Access, at the move to production                      |
| Should admins also see the full audit log?                                       | Only the rows for owners, sites and enquiries                     |

## 12. What step 1 built (18 Oct 2026)

**Roles.** `superadmin` is the first of six roles. Every access helper in `src/payload/access/index.ts` ranks it above admin, refuses anyone suspended, and refuses anyone still holding a given password (they may only read and change their own account). Permanent deletion in all 18 collections that allowed it is now super admin only.

**Publishing.** `canPublish` lets a super admin, admin or editor publish; the editorial hook uses it, so a super admin publishes articles, guides and reports to the website through the same fact-check gate.

**Team accounts** (`collections/Users.ts`, `hooks/team.ts`): `active`, `mustChangePassword` and `lastSignInAt` fields; only a super admin adds people, changes roles or suspends; anyone can change their own password; lockout after 5 wrong passwords for 15 minutes; 8-hour sessions; suspension clears sessions; the last active super admin cannot be demoted, suspended or deleted. Migration `20261018_071753_super_admin`.

**Seeding** (`team-accounts.ts`, `seed-team.ts`, called from `seed.ts`): reads `SUPER_ADMIN_EMAILS`, `SUPER_ADMIN_PASSWORD`, `TEAM_ACCOUNTS` and `SUPER_ADMIN_RESET`, as in section 5. The old `SEED_ADMIN_PASSWORD`, which rewrote passwords on every release and printed them, is gone. Locally, `admin@ohworks.local` is now a super admin, and `manager@`, `editor@`, `writer@`, `contributor@` and `ops@ohworks.local` cover the other roles, all with `ohworks-admin-local`. The three named super admins are in the local `.env` and start with the same local password, which they must change.

**Change-password screen** (`src/payload/admin/PasswordGate.tsx`): a provider around the admin that sends someone with `mustChangePassword` to their account page, with a notice, until they save a new password.

**Checked:**

- `pnpm test`: 11 unit tests on the access helpers and settings.
- `verify:cms`: 33 checks on the test database, all passing. They cover a super admin publishing; ops and admin unable to add people; admin unable to grant super admin or raise their own role; a super admin unable to change their own role; short passwords refused; deletion super admin only; sign-in recorded; suspension ending a live session and blocking sign-in; a given password locking everything until replaced; the last super admin protected three ways (each tried in a rolled-back transaction); and the seed run twice changing no one's password.
- `release.mjs` against an empty database: refused with no super admin set, and refused with addresses but no password. With both set it created the three super admins, a second release changed nothing, a team member was added from `TEAM_ACCOUNTS`, and `SUPER_ADMIN_RESET` reset and unlocked. No password was printed.

**What production needs before its first release:** `SUPER_ADMIN_EMAILS` and `SUPER_ADMIN_PASSWORD` in Secret Manager, referenced by the release job.
