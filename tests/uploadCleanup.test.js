const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

function loadFreshUploadCleanup() {
  const modulePath = require.resolve('../backend/utils/uploadCleanup');
  delete require.cache[modulePath];
  return require('../backend/utils/uploadCleanup');
}

test('uploadCleanup resolves only /uploads paths inside configured upload dir', async () => {
  const tempDir = path.join(os.tmpdir(), `roommie-upload-test-${Date.now()}`);
  process.env.UPLOAD_DIR = tempDir;
  const { resolveUploadPath } = loadFreshUploadCleanup();

  assert.equal(resolveUploadPath('/uploads/test.png'), path.join(tempDir, 'test.png'));
  assert.equal(resolveUploadPath('/images/test.png'), null);
});

test('uploadCleanup deletes known upload files and ignores missing ones', async () => {
  const tempDir = path.join(os.tmpdir(), `roommie-upload-test-${Date.now()}-files`);
  await fs.mkdir(tempDir, { recursive: true });
  process.env.UPLOAD_DIR = tempDir;
  const { deleteUploadFiles } = loadFreshUploadCleanup();

  const firstFile = path.join(tempDir, 'first.png');
  const secondFile = path.join(tempDir, 'second.png');
  await fs.writeFile(firstFile, 'one');
  await fs.writeFile(secondFile, 'two');

  await deleteUploadFiles(['/uploads/first.png', '/uploads/second.png', '/uploads/missing.png']);

  await assert.rejects(() => fs.access(firstFile));
  await assert.rejects(() => fs.access(secondFile));
});
