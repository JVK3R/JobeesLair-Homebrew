// Which release of a repository the index lists, and which of its files are real: the decisions build-index.mjs
// makes about release files, apart from the network so tests/release-files.test.mjs can run them.

// Smaller than this, a release file is a stand-in, not an app: one author's newest release held only a 4-byte
// Void.pkg whose whole content was "soon", and every install of it failed.
export const MIN_FILE = 1024;

// The format of a package from its first four bytes: "ps4" (\x7FCNT), "ps5" (\x7FFIH, which carries a CNT
// header of its own further in) or null when it is not a package at all.
export function packageFormat(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0x7f) return null;
  const magic = String.fromCharCode(bytes[1], bytes[2], bytes[3]);
  return magic === 'CNT' ? 'ps4' : magic === 'FIH' ? 'ps5' : null;
}

// The release to list and its files. `releases` are the repository's newest first, drafts left out;
// `filesOf(release)` resolves to { files, refused }: the files the console can use, and a line for each one
// that looked like a console file but was not (a stand-in, not a package). A release whose console files
// were all refused is passed over for the next one, so a placeholder release does not hide the build before
// it; a release with no console files at all ends the search, as before. `passedOver` names what was skipped.
export async function pickRelease(releases, filesOf) {
  const passedOver = [];
  for (const release of releases) {
    const { files, refused } = await filesOf(release);
    if (files.length) return { release, files, passedOver };
    if (!refused.length) break;
    passedOver.push(`${release.tag_name}: ${refused.join(', ')}`);
  }
  return { release: null, files: [], passedOver };
}

// An app's helpers (sources.json `with`) never lead its files: the first file is what Install installs, and
// a helper ranks above a package by kind, as a payload.
export function helpersLast(files, helpers = []) {
  return [...files].sort((a, b) => Number(helpers.includes(a.name)) - Number(helpers.includes(b.name)));
}

// An archive built for a computer or a phone, or the project's source code, by its name. "mac" and "x64" came in
// when Orbit Store's Orbit-Zero-1.6.0-mac-x64.zip (its Mac app) was listed as a PS5 payload: every install of it
// failed, the console's extractor refusing the links a Mac app holds.
export const PC_ARCHIVE = /(^|[-_. ])(windows|win32|win64|win-x64|x64|x86[-_]64|amd64|arm64|aarch64|mac|macos|osx|darwin|linux|ubuntu|android|ios|source|sources|src|symbols|desktop|portable|frontend-|host-|keys)([-_. ]|$)|redump/i;

// An archive holding a Mac app bundle is a computer's, whatever its name: the payload inside one (Orbit Zero
// carries orbit_store.elf to send it) is the same file the release ships on its own.
export const desktopBundle = (paths) => paths.some((p) => /(^|\/)[^/]+\.app\/Contents\//i.test(p));
