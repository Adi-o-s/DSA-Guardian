// Builds data/company.json from the snehasishroy company-wise CSV repo.
// Shape: { slug: { companies: { [company]: frequencyPercent } } }
// Run: node scripts/ingest-company.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE =
  "https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master";

// Curated set of widely-asked companies (dir names in the repo). Edit freely.
const COMPANIES = [
  "amazon", "google", "microsoft", "meta", "facebook", "apple", "bloomberg",
  "adobe", "uber", "oracle", "goldman-sachs", "linkedin", "salesforce",
  "netflix", "nvidia", "paypal", "atlassian", "vmware", "walmart-labs",
  "tiktok", "bytedance", "snapchat", "twitter", "airbnb", "doordash",
  "stripe", "databricks", "samsung", "flipkart", "swiggy", "zomato",
  "paytm", "tcs", "infosys", "wipro", "accenture", "cisco", "intuit",
  "servicenow", "ibm", "qualcomm", "yandex", "yahoo", "expedia", "visa",
  "american-express", "morgan-stanley", "jpmorgan", "de-shaw", "dropbox",
];

function slugFromUrl(url) {
  const m = String(url).match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  return m ? m[1] : null;
}

// minimal CSV parse (these files have no quoted commas in the fields we use)
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const urlIdx = header.findIndex((h) => /url/i.test(h));
  const freqIdx = header.findIndex((h) => /frequency/i.test(h));
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return { url: cols[urlIdx], freq: cols[freqIdx] };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const out = {};
  let okCompanies = 0;
  for (const company of COMPANIES) {
    try {
      const res = await fetch(`${BASE}/${company}/all.csv`);
      if (!res.ok) {
        process.stdout.write(`\n  skip ${company} (HTTP ${res.status})`);
        continue;
      }
      const rows = parseCsv(await res.text());
      for (const { url, freq } of rows) {
        const slug = slugFromUrl(url);
        if (!slug) continue;
        const f = parseFloat(String(freq).replace("%", "")) || 0;
        out[slug] ??= { companies: {} };
        out[slug].companies[company] = Math.round(f * 10) / 10;
      }
      okCompanies++;
      process.stdout.write(`\rIngested ${okCompanies} companies`);
    } catch (e) {
      process.stdout.write(`\n  error ${company}: ${e.message}`);
    }
    await sleep(150);
  }
  const dest = join(__dirname, "..", "data", "company.json");
  writeFileSync(dest, JSON.stringify(out, null, 0));
  console.log(
    `\nWrote ${dest}: ${Object.keys(out).length} problems across ${okCompanies} companies.`
  );
}

main().catch((e) => {
  console.error("\nCompany ingest failed:", e.message);
  process.exit(1);
});
