const fs = require('fs/promises');
const path = require('path');

function getUploadDir() {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
    : path.resolve(__dirname, '..', 'uploads');
}

function resolveUploadPath(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return null;

  let pathname = imageUrl.trim();
  try {
    pathname = new URL(imageUrl, 'http://localhost').pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith('/uploads/')) return null;

  const fileName = path.basename(pathname);
  if (!fileName) return null;

  return path.join(getUploadDir(), fileName);
}

async function deleteUploadFiles(imageUrls) {
  const uniquePaths = [...new Set((imageUrls || []).map(resolveUploadPath).filter(Boolean))];

  await Promise.all(uniquePaths.map(async (filePath) => {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`Could not delete upload file ${filePath}: ${error.message}`);
      }
    }
  }));
}

module.exports = {
  deleteUploadFiles,
  getUploadDir,
  resolveUploadPath,
};
