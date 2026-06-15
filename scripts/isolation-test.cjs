// Proves cross-user data isolation + cookie encryption against the real DB,
// exercising the actual lib code paths (withUser / currentUserId / queries).
// CommonJS so it shares one module cache with the lib files (which compile to
// CJS), keeping a single AsyncLocalStorage instance.
//
// Run: node --conditions=react-server --import tsx scripts/isolation-test.cjs
const {
  upsertUserByGithub,
  withUser,
  getSetting,
  setSetting,
  getCookie,
  query,
  pool,
} = require("../lib/db");
const { toggleManual, getSolvedSet } = require("../lib/sync");

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
}

async function main() {
  const a = await upsertUserByGithub({ githubId: 990001, username: "alice" });
  const b = await upsertUserByGithub({ githubId: 990002, username: "bob" });
  check("two distinct user ids", a.id !== b.id);

  await withUser(a.id, async () => {
    await setSetting("username", "alice");
    await toggleManual("two-sum");
    await toggleManual("add-two-numbers");
    await setSetting("cookie", "ALICE_SECRET_COOKIE");
  });

  await withUser(b.id, async () => {
    await setSetting("username", "bob");
    await toggleManual("two-sum");
  });

  await withUser(a.id, async () => {
    const solved = await getSolvedSet();
    check("A sees exactly its 2 solves", solved.size === 2);
    check("A sees two-sum", solved.has("two-sum"));
    check("A sees add-two-numbers", solved.has("add-two-numbers"));
    check("A username is alice", (await getSetting("username")) === "alice");
  });

  await withUser(b.id, async () => {
    const solved = await getSolvedSet();
    check("B sees exactly its 1 solve", solved.size === 1);
    check("B does NOT see A-only add-two-numbers", !solved.has("add-two-numbers"));
    check("B username is bob", (await getSetting("username")) === "bob");
  });

  const rawA = await query(
    "SELECT value FROM settings WHERE user_id = $1 AND key = 'cookie'",
    [a.id]
  );
  check("cookie stored ciphertext (not plaintext)", rawA[0]?.value !== "ALICE_SECRET_COOKIE");
  check("cookie ciphertext has nonce:cipher form", (rawA[0]?.value ?? "").includes(":"));
  await withUser(a.id, async () => {
    check("getCookie() decrypts to original", (await getCookie()) === "ALICE_SECRET_COOKIE");
  });
  await withUser(b.id, async () => {
    check("B has no cookie", (await getCookie()) === "");
  });

  let threw = false;
  try {
    await getSolvedSet();
  } catch {
    threw = true;
  }
  check("getSolvedSet() outside withUser throws", threw);

  await query("DELETE FROM users WHERE github_id IN (990001, 990002)", []);

  await pool().end();
  console.log(
    failures === 0 ? "\nALL ISOLATION CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
