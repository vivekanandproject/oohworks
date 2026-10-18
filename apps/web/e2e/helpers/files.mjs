/**
 * Makes the files the owner tests upload: a photograph, a scanned document, and spreadsheets built
 * from the site's own template. It runs as its own process because the test runner's module loader
 * cannot load the spreadsheet library. Input, if any, is JSON on stdin; output is JSON on stdout.
 *
 *   node files.mjs photo | scan          → { base64 }
 *   node files.mjs textured              → { base64, copy }   a photograph with detail, and a resent copy
 *   node files.mjs stock                 → { base64 }         one whose file credits a stock library
 *   node files.mjs template              ← { template }                → { head, example, guideRows }
 *   node files.mjs sheet                 ← { template, rows }          → { base64 }
 *   node files.mjs plain                 ← { rows }                    → { base64 }
 *   node files.mjs read                  ← { book }                    → { rows: [{ header: { value, note } }] }
 */
import ExcelJS from "exceljs";
import sharp from "sharp";

const read = async () => {
  let text = "";
  for await (const chunk of process.stdin) text += chunk;
  return text ? JSON.parse(text) : {};
};
const out = (value) => process.stdout.write(JSON.stringify(value));
const b64 = (buffer) => Buffer.from(buffer).toString("base64");
/** A cell written as { "$date": "2026-11-20" } becomes a real date cell, as a spreadsheet would hold it. */
const cell = (v) =>
  v && typeof v === "object" && "$date" in v ? new Date(`${v.$date}T00:00:00Z`) : (v ?? null);

const command = process.argv[2];
if (command === "photo") {
  out({
    base64: b64(
      await sharp({
        create: { width: 1200, height: 800, channels: 3, background: { r: 110, g: 130, b: 150 } },
      })
        .jpeg()
        .toBuffer(),
    ),
  });
} else if (command === "scan") {
  out({
    base64: b64(
      await sharp({
        create: { width: 600, height: 800, channels: 3, background: { r: 250, g: 250, b: 245 } },
      })
        .png()
        .toBuffer(),
    ),
  });
} else if (command === "textured" || command === "stock") {
  // Blurred noise stands in for a photograph with detail; flat test photographs have no fingerprint.
  const noise = await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
      noise: { type: "gaussian", mean: 128, sigma: 60 },
    },
  })
    .png()
    .toBuffer();
  const photo = await sharp(noise).blur(12).resize(1200, 900).jpeg({ quality: 88 }).toBuffer();
  if (command === "textured")
    out({
      base64: b64(photo),
      // As a messaging app sends it on: smaller, and compressed again.
      copy: b64(await sharp(photo).resize(800).jpeg({ quality: 50 }).toBuffer()),
    });
  else
    out({
      base64: b64(
        await sharp(photo)
          .withExif({ IFD0: { Copyright: "Image: Shutterstock / A. Person" } })
          .jpeg()
          .toBuffer(),
      ),
    });
} else if (command === "template" || command === "sheet") {
  const input = await read();
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(Buffer.from(input.template, "base64"));
  const sheet = book.getWorksheet("Sites");
  const head = sheet.getRow(1).values.slice(1);
  if (command === "template") {
    out({
      head,
      example: sheet.getRow(2).getCell(1).value,
      guideRows: book.getWorksheet("How to fill it in")?.rowCount ?? 0,
    });
  } else {
    for (const [n, values] of Object.entries(input.rows))
      head.forEach((h, i) => (sheet.getRow(Number(n)).getCell(i + 1).value = cell(values[h])));
    out({ base64: b64(await book.xlsx.writeBuffer()) });
  }
} else if (command === "read") {
  const input = await read();
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(Buffer.from(input.book, "base64"));
  const sheet = book.getWorksheet("Sites");
  const head = sheet.getRow(1).values.slice(1);
  const rows = [];
  for (let n = 2; n <= sheet.rowCount; n += 1) {
    const row = sheet.getRow(n);
    const cells = head.map((h, i) => {
      const c = row.getCell(i + 1);
      return [h, { value: c.value ?? null, note: c.note ? String(c.note) : null }];
    });
    rows.push(Object.fromEntries(cells));
  }
  out({ rows });
} else if (command === "plain") {
  const input = await read();
  const book = new ExcelJS.Workbook();
  book.addWorksheet("Sheet1").addRows(input.rows);
  out({ base64: b64(await book.xlsx.writeBuffer()) });
} else {
  process.stderr.write(`unknown command: ${command}\n`);
  process.exit(1);
}
