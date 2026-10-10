/**
 * Week-one exit check, run against a seeded database:
 * an editor drafts a news piece with an unchecked Fact, cannot publish, ticks the Fact, publishes;
 * a writer can draft but cannot publish. Cleans up after itself.
 */
import { getPayload } from "payload";
import type { Article } from "../payload-types";
import config from "../payload.config";

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
  finish();
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
