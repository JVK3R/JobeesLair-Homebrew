// tools/release-files.mjs: stand-in files, package formats, which release is listed, helpers last. Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_FILE, helpersLast, packageFormat, pickRelease } from '../tools/release-files.mjs';

const bytes = (text) => Buffer.from(text, 'latin1');

test('package formats: PS4 and PS5 packages by their first bytes, anything else is none', () => {
  assert.equal(packageFormat(bytes('\x7FCNT\x80\x00')), 'ps4');
  assert.equal(packageFormat(bytes('\x7FFIH\x01\x00')), 'ps5');
  assert.equal(packageFormat(bytes('soon')), null, 'the 4-byte Void.pkg');
  assert.equal(packageFormat(bytes('<!DOCTYPE html>')), null);
  assert.equal(packageFormat(bytes('\x7FELF')), null);
  assert.equal(packageFormat(bytes('\x7FC')), null);
  assert.equal(packageFormat(null), null);
  assert.ok(MIN_FILE >= 1024);
});

test('a release whose console files are all stand-ins is passed over for the one before it', async () => {
  const releases = [{ tag_name: '1.4.9' }, { tag_name: '1.4.8' }, { tag_name: '1.4.7' }];
  const asked = [];
  const filesOf = async (release) => {
    asked.push(release.tag_name);
    if (release.tag_name === '1.4.9') return { files: [], refused: ['Void.pkg is 4 bytes'] };
    return { files: [{ name: `SpectrumLibrary_${release.tag_name}.elf` }], refused: [] };
  };
  const picked = await pickRelease(releases, filesOf);
  assert.equal(picked.release.tag_name, '1.4.8');
  assert.deepEqual(picked.files.map((f) => f.name), ['SpectrumLibrary_1.4.8.elf']);
  assert.deepEqual(picked.passedOver, ['1.4.9: Void.pkg is 4 bytes']);
  assert.deepEqual(asked, ['1.4.9', '1.4.8'], 'no further than it has to');
});

test('the newest release is listed when it has files, and one without console files ends the search', async () => {
  const good = await pickRelease([{ tag_name: 'v2' }, { tag_name: 'v1' }], async () => ({ files: [{ name: 'a.elf' }], refused: ['tiny.bin is 3 bytes'] }));
  assert.equal(good.release.tag_name, 'v2');
  assert.deepEqual(good.passedOver, [], 'a refused file beside a good one passes nothing over');
  // A release of PC tools only is not a placeholder: the app is left out as before, not listed from an old release.
  const asked = [];
  const none = await pickRelease([{ tag_name: 'pc-1.0' }, { tag_name: 'ps5-0.9' }], async (release) => {
    asked.push(release.tag_name);
    return release.tag_name === 'pc-1.0' ? { files: [], refused: [] } : { files: [{ name: 'old.elf' }], refused: [] };
  });
  assert.equal(none.release, null);
  assert.deepEqual(asked, ['pc-1.0']);
  const all = await pickRelease([{ tag_name: 'b' }, { tag_name: 'a' }], async (release) => ({ files: [], refused: [`x.pkg in ${release.tag_name} is not a package`] }));
  assert.equal(all.release, null);
  assert.equal(all.passedOver.length, 2);
});

test('helpers never lead: the package installs, its agent payload comes with it', () => {
  const files = [{ name: 'ps5library-agent.elf', kind: 'payload' }, { name: 'PS5Library-0.2.91.pkg', kind: 'pkg' }];
  assert.deepEqual(helpersLast(files, ['ps5library-agent.elf']).map((f) => f.name), ['PS5Library-0.2.91.pkg', 'ps5library-agent.elf']);
  assert.deepEqual(helpersLast(files).map((f) => f.name), files.map((f) => f.name), 'no helpers: the order stays');
  const many = [{ name: 'app.zip' }, { name: 'helper.elf' }, { name: 'other.elf' }];
  assert.deepEqual(helpersLast(many, ['helper.elf']).map((f) => f.name), ['app.zip', 'other.elf', 'helper.elf'], 'otherwise in rank order');
});

test('archives built for a computer stay out: by name, or by a Mac app inside (Orbit Zero, 2026-10-27)', async () => {
  const { PC_ARCHIVE, desktopBundle } = await import('../tools/release-files.mjs');
  // Orbit Store 1.6.0's computer builds: the Mac x64 zip was listed as a PS5 payload, and every install failed.
  for (const name of ['Orbit-Zero-1.6.0-mac-x64.zip', 'Orbit-Zero-1.6.0-mac-arm64.zip', 'Orbit-Zero-1.6.0-win-x64.zip',
    'Orbit-Zero-1.6.0-win-arm64.zip', 'Orbit-Zero-1.6.0-linux-x64.tar.gz', 'orbit-store-1.6.0-source-bundle.zip'])
    assert.ok(PC_ARCHIVE.test(name), name);
  for (const name of ['PS5-RetroArch.zip', 'ps5sx2-v1.2.zip', 'Emulator_Pack.7z', 'machine-learning-demo.zip', 'winamp-skin-viewer.zip', 'prospero-win-v0.2.0.zip'])
    assert.ok(!PC_ARCHIVE.test(name), name);
  assert.ok(desktopBundle(['Orbit Zero.app/Contents/Info.plist', 'Orbit Zero.app/Contents/Resources/orbit/orbit_store.elf']));
  assert.ok(!desktopBundle(['payload/orbit_store.elf', 'readme.txt', 'Apps/app.json']));
});
