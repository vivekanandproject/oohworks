/**
 * Week-one exit check, run against the test database (`pnpm verify:cms`, after `pnpm test:db`):
 * an editor drafts a news piece with an unchecked Fact, cannot publish, ticks the Fact, publishes;
 * a writer can draft but cannot publish. Then the team: what a super admin alone may do, suspension,
 * given passwords, and that OOHWORKS always keeps a super admin. Cleans up after itself.
 */
import { createLocalReq, getPayload, type Payload, type PayloadRequest } from "payload";
import type { Article, User } from "../payload-types";
import config from "../payload.config";
import { seedTeam } from "./seed-team";

const results: string[] = [];
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed += 1;
}

function body(sourceId: number | string, checked: boolean): Article["body"] {
  const inline = {
    type: "inlineBlock",
    version: 1,
    fields: {
      id: "fact1",
      blockType: "fact",
      value: "54.2",
      unit: "$ bn",
      source: sourceId,
      asOf: "2025-12-31",
      checked,
    },
  };
  const text = (t: string) => ({
    type: "text",
    version: 1,
    text: t,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
  });
  const para = (children: unknown[]) => ({
    type: "paragraph",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    textFormat: 0,
    children,
  });
  return {
    root: {
      type: "root",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      children: [
        para([
          text("Global OOH spend reached "),
          inline,
          text(" in 2025, up 15% on the year, the strongest growth of any traditional medium."),
        ]),
        para([
          text(
            "Digital screens now take almost half of the total, and the share keeps rising as owners convert static faces.",
          ),
        ]),
      ],
    },
  } as unknown as Article["body"];
}

async function main() {
  const payload = await getPayload({ config });
  const editor = (
    await payload.find({
      collection: "users",
      where: { email: { equals: "editor@ohworks.local" } },
      overrideAccess: true,
    })
  ).docs[0];
  const writer = (
    await payload.find({
      collection: "users",
      where: { email: { equals: "writer@ohworks.local" } },
      overrideAccess: true,
    })
  ).docs[0];
  const desk = (
    await payload.find({
      collection: "people",
      where: { slug: { equals: "editorial-desk" } },
      overrideAccess: true,
    })
  ).docs[0];
  const source = (
    await payload.find({
      collection: "sources",
      where: { title: { like: "WOO Global" } },
      overrideAccess: true,
    })
  ).docs[0];
  const place = (
    await payload.find({
      collection: "tags",
      where: { name: { equals: "India" } },
      overrideAccess: true,
    })
  ).docs[0];
  check("seed present", Boolean(editor && writer && desk && source && place));
  if (!editor || !writer || !desk || !source || !place) return finish();

  // 1. Editor drafts with an unchecked fact.
  const draft = await payload.create({
    collection: "articles",
    user: editor,
    overrideAccess: false,
    data: {
      pillar: "news",
      layout: "standard",
      title: "Verification: global OOH spend 2025",
      standfirst: "A test piece created by the week-one check.",
      body: body(source.id, false),
      authors: [desk.id],
      places: [place.id],
      workflow: "draft",
      _status: "draft",
    },
  });
  check(
    "editor creates a draft",
    draft._status === "draft" && draft.slug === "verification-global-ooh-spend-2025",
    `slug=${draft.slug} readingTime=${draft.readingTime}`,
  );
  check("reading time computed", (draft.readingTime ?? 0) >= 1);
  check(
    "createdBy set",
    String((draft.createdBy as { id?: unknown })?.id ?? draft.createdBy) === String(editor.id),
  );

  // 2. Publish is blocked while a fact is unchecked.
  let blocked = "";
  try {
    await payload.update({
      collection: "articles",
      id: draft.id,
      user: editor,
      overrideAccess: false,
      data: { workflow: "fact_checked", _status: "published" },
    });
  } catch (e) {
    blocked = (e as Error).message;
  }
  check("publish blocked by unchecked fact", /not yet checked/.test(blocked), blocked.slice(0, 80));

  // 3. Publish is blocked while the workflow is not fact-checked, even with facts ticked.
  blocked = "";
  try {
    await payload.update({
      collection: "articles",
      id: draft.id,
      user: editor,
      overrideAccess: false,
      data: { body: body(source.id, true), workflow: "in_review", _status: "published" },
    });
  } catch (e) {
    blocked = (e as Error).message;
  }
  check(
    "publish blocked before fact-checked state",
    /fact-checked/.test(blocked),
    blocked.slice(0, 80),
  );

  // 4. Ticked and fact-checked: publishes, workflow and date set.
  const published = await payload.update({
    collection: "articles",
    id: draft.id,
    user: editor,
    overrideAccess: false,
    data: { body: body(source.id, true), workflow: "fact_checked", _status: "published" },
  });
  check(
    "editor publishes after fact-check",
    published._status === "published" &&
      published.workflow === "published" &&
      Boolean(published.publishedAt),
    `publishedAt=${published.publishedAt}`,
  );

  // 5. Public read sees only published; drafts are hidden.
  const anon = await payload.find({
    collection: "articles",
    where: { id: { equals: draft.id } },
    overrideAccess: false,
  });
  check("anonymous reads the published piece", anon.totalDocs === 1);

  // 6. Writer drafts but cannot publish.
  const wd = await payload.create({
    collection: "articles",
    user: writer,
    overrideAccess: false,
    data: {
      pillar: "news",
      layout: "standard",
      title: "Verification: writer draft",
      standfirst: "Writer test.",
      body: body(source.id, true),
      authors: [desk.id],
      workflow: "fact_checked",
      _status: "draft",
    },
  });
  blocked = "";
  try {
    await payload.update({
      collection: "articles",
      id: wd.id,
      user: writer,
      overrideAccess: false,
      data: { _status: "published" },
    });
  } catch (e) {
    blocked = (e as Error).message;
  }
  check("writer cannot publish", /Only an editor/.test(blocked), blocked.slice(0, 60));

  // 7. Writer cannot edit the editor's published piece.
  blocked = "";
  try {
    await payload.update({
      collection: "articles",
      id: draft.id,
      user: writer,
      overrideAccess: false,
      data: { standfirst: "tampered" },
    });
  } catch (e) {
    blocked = (e as Error).message;
  }
  check("writer cannot edit another's published piece", blocked.length > 0, blocked.slice(0, 60));

  // 8. Versions exist.
  const versions = await payload.findVersions({
    collection: "articles",
    where: { parent: { equals: draft.id } },
    overrideAccess: true,
  });
  check("version history recorded", versions.totalDocs >= 2, `versions=${versions.totalDocs}`);

  // Clean up.
  await payload.delete({ collection: "articles", id: draft.id, overrideAccess: true });
  await payload.delete({ collection: "articles", id: wd.id, overrideAccess: true });

  await verifyTeam(payload, { desk: desk.id, source: source.id, place: place.id });
  finish();
}

/** The error a call throws, or "" when it goes through. */
async function refusal(call: () => Promise<unknown>): Promise<string> {
  try {
    await call();
    return "";
  } catch (e) {
    return (e as Error).message || "refused";
  }
}

async function verifyTeam(payload: Payload, refs: { desk: number; source: number; place: number }) {
  const PASSWORD = "verify-team-password";
  const byEmail = async (email: string) =>
    (
      await payload.find({
        collection: "users",
        where: { email: { equals: email } },
        depth: 0,
        overrideAccess: true,
      })
    ).docs[0];
  const superAdmin = await byEmail("admin@ohworks.local");
  check(
    "demo super admin seeded",
    superAdmin?.role === "superadmin",
    superAdmin?.role ?? "missing",
  );
  if (!superAdmin) return;

  const made: User[] = [];
  const make = async (email: string, role: User["role"]) => {
    const old = await byEmail(email);
    if (old) await payload.delete({ collection: "users", id: old.id, overrideAccess: true });
    const u = await payload.create({
      collection: "users",
      data: { email, name: email, role, password: PASSWORD, active: true },
      overrideAccess: true,
    });
    made.push(u);
    return u;
  };
  const fresh = async (u: User) =>
    payload.findByID({ collection: "users", id: u.id, depth: 0, overrideAccess: true });

  try {
    const ops = await make("verify-ops@ohworks.local", "ops");
    const admin = await make("verify-admin@ohworks.local", "admin");

    // A super admin publishes a piece once its facts are checked, like an editor.
    const piece = await payload.create({
      collection: "articles",
      user: superAdmin,
      overrideAccess: false,
      data: {
        pillar: "news",
        layout: "standard",
        title: "Verification: a super admin publishes",
        standfirst: "A test piece created by the team check.",
        body: body(refs.source, true),
        authors: [refs.desk],
        places: [refs.place],
        workflow: "fact_checked",
        _status: "published",
      },
    });
    check("super admin publishes a fact-checked piece", piece._status === "published");
    await payload.delete({ collection: "articles", id: piece.id, overrideAccess: true });

    // Only a super admin adds people, grants super admin, or changes roles.
    const added = await refusal(() =>
      payload.create({
        collection: "users",
        user: ops,
        overrideAccess: false,
        data: { email: "verify-x@ohworks.local", name: "x", role: "writer", password: PASSWORD },
      }),
    );
    check("ops cannot add a team member", added.length > 0, added.slice(0, 60));
    const added2 = await refusal(() =>
      payload.create({
        collection: "users",
        user: admin,
        overrideAccess: false,
        data: { email: "verify-x@ohworks.local", name: "x", role: "writer", password: PASSWORD },
      }),
    );
    check("admin cannot add a team member", added2.length > 0, added2.slice(0, 60));
    await refusal(() =>
      payload.update({
        collection: "users",
        id: ops.id,
        user: admin,
        overrideAccess: false,
        data: { role: "superadmin" },
      }),
    );
    check("admin cannot make someone a super admin", (await fresh(ops)).role === "ops");
    await refusal(() =>
      payload.update({
        collection: "users",
        id: admin.id,
        user: admin,
        overrideAccess: false,
        data: { role: "superadmin" },
      }),
    );
    check("admin cannot raise their own role", (await fresh(admin)).role === "admin");
    const own = await refusal(() =>
      payload.update({
        collection: "users",
        id: superAdmin.id,
        user: superAdmin,
        overrideAccess: false,
        data: { role: "admin" },
      }),
    );
    check("super admin cannot change their own role", /own role/.test(own), own.slice(0, 60));
    const short = await refusal(() =>
      payload.update({
        collection: "users",
        id: ops.id,
        user: superAdmin,
        overrideAccess: false,
        data: { password: "too-short" },
      }),
    );
    check(
      "a password under 12 characters is refused",
      /12 characters/.test(short),
      short.slice(0, 60),
    );
    const deleteSite = await refusal(() =>
      payload.delete({
        collection: "tags",
        where: { name: { equals: "no-such-tag-verify" } },
        user: admin,
        overrideAccess: false,
      }),
    );
    check("only a super admin deletes permanently", deleteSite.length > 0, deleteSite.slice(0, 60));

    // Signing in is recorded; a suspension signs the person out and keeps them out.
    const signedIn = await payload.login({
      collection: "users",
      data: { email: ops.email, password: PASSWORD },
    });
    check("sign-in recorded", Boolean((await fresh(ops)).lastSignInAt));
    const asOps = async () =>
      (await payload.auth({ headers: new Headers({ Authorization: `JWT ${signedIn.token}` }) }))
        .user;
    check("a signed-in session works", Boolean(await asOps()));
    await payload.update({
      collection: "users",
      id: ops.id,
      user: superAdmin,
      overrideAccess: false,
      data: { active: false },
    });
    check("a suspension ends the session at once", !(await asOps()));
    const again = await refusal(() =>
      payload.login({ collection: "users", data: { email: ops.email, password: PASSWORD } }),
    );
    check("a suspended person cannot sign in", /suspended/.test(again), again.slice(0, 60));
    await payload.update({
      collection: "users",
      id: ops.id,
      user: superAdmin,
      overrideAccess: false,
      data: { active: true },
    });

    // A password someone is given must be replaced before they can do anything else.
    await payload.update({
      collection: "users",
      id: admin.id,
      user: superAdmin,
      overrideAccess: false,
      data: { password: "given-by-a-super-admin" },
    });
    const given = await fresh(admin);
    check("a given password must be changed", given.mustChangePassword === true);
    const before = await refusal(() =>
      payload.find({ collection: "enquiries", user: given, overrideAccess: false }),
    );
    check("until then, nothing else is open", before.length > 0, before.slice(0, 60));
    await payload.update({
      collection: "users",
      id: admin.id,
      user: given,
      overrideAccess: false,
      data: { password: "chosen-by-themselves" },
    });
    const chosen = await fresh(admin);
    check("replacing it opens the admin", chosen.mustChangePassword === false);
    const after = await refusal(() =>
      payload.find({ collection: "enquiries", user: chosen, overrideAccess: false }),
    );
    check("and the work is open again", after === "", after.slice(0, 60));

    // There is always an active super admin. Each attempt runs in a transaction of its own, with every
    // other super admin suspended for the moment, and is rolled back, so the database is left as it
    // was. One attempt per transaction, because a refused operation rolls its transaction back itself.
    // No user is on the request, as in a seed, so the guard tried is the one for the last super admin.
    const asOnlySuperAdmin = async (
      attempt: (req: PayloadRequest, id: number) => Promise<unknown>,
    ): Promise<string> => {
      const req = await createLocalReq({}, payload);
      const transaction = await payload.db.beginTransaction();
      if (!transaction) return "no transaction was opened, so this was not tried";
      req.transactionID = transaction;
      try {
        const temp = await payload.create({
          collection: "users",
          req,
          data: {
            email: "verify-last@ohworks.local",
            name: "last",
            role: "superadmin",
            password: PASSWORD,
          },
          overrideAccess: true,
        });
        await payload.update({
          collection: "users",
          where: { and: [{ role: { equals: "superadmin" } }, { id: { not_equals: temp.id } }] },
          data: { active: false },
          req,
          overrideAccess: true,
        });
        return await refusal(() => attempt(req, temp.id));
      } finally {
        await payload.db.rollbackTransaction(transaction).catch(() => {});
      }
    };
    const last = /always have an active super admin/;
    const demote = await asOnlySuperAdmin((req, id) =>
      payload.update({
        collection: "users",
        id,
        req,
        data: { role: "admin" },
        overrideAccess: true,
      }),
    );
    check("the last super admin cannot be demoted", last.test(demote), demote.slice(0, 60));
    const suspend = await asOnlySuperAdmin((req, id) =>
      payload.update({
        collection: "users",
        id,
        req,
        data: { active: false },
        overrideAccess: true,
      }),
    );
    check("the last super admin cannot be suspended", last.test(suspend), suspend.slice(0, 60));
    const remove = await asOnlySuperAdmin((req, id) =>
      payload.delete({ collection: "users", id, req, overrideAccess: true }),
    );
    check("the last super admin cannot be deleted", last.test(remove), remove.slice(0, 60));
    const supers = (active?: boolean) =>
      payload.count({
        collection: "users",
        where: {
          and: [
            { role: { equals: "superadmin" } },
            ...(active ? [{ active: { equals: true } }] : []),
          ],
        },
        overrideAccess: true,
      });
    const [allSupers, activeSupers] = await Promise.all([supers(), supers(true)]);
    check(
      "the rollbacks left every super admin active",
      allSupers.totalDocs === activeSupers.totalDocs && allSupers.totalDocs > 0,
      `${activeSupers.totalDocs} of ${allSupers.totalDocs}`,
    );

    // The seed can run again and again without changing anyone's password.
    const hashOf = async () =>
      (
        (await payload.findByID({
          collection: "users",
          id: superAdmin.id,
          showHiddenFields: true,
          overrideAccess: true,
        })) as User & { hash?: string }
      ).hash;
    const hashBefore = await hashOf();
    const countBefore = (await payload.count({ collection: "users", overrideAccess: true }))
      .totalDocs;
    await seedTeam(payload);
    await seedTeam(payload);
    const countAfter = (await payload.count({ collection: "users", overrideAccess: true }))
      .totalDocs;
    check(
      "the team seed runs twice and changes nothing",
      countAfter === countBefore && (await hashOf()) === hashBefore,
      `users ${countBefore} → ${countAfter}`,
    );
  } finally {
    for (const u of made)
      await payload.delete({ collection: "users", id: u.id, overrideAccess: true });
  }
}

function finish() {
  console.log(results.join("\n"));
  console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
