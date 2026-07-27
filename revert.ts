import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

async function walk(dir, fileList = []) {
  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (file.startsWith('.') || file.startsWith('tmp') || ['node_modules', 'dist', 'build'].includes(file) || file.endsWith('.png') || file.endsWith('.gif') || file.endsWith('.svg') || file.endsWith('.woff') || file.endsWith('.woff2') || file.endsWith('.ttf') || file.endsWith('.ico')) {
        continue;
      }
      const filePath = join(dir, file);
      try {
        const fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
          await walk(filePath, fileList);
        } else {
          fileList.push(filePath);
        }
      } catch (e) {
          // ignore
      }
    }
  } catch(e) {
    // ignore
  }
  return fileList;
}

const dir = process.cwd();
const files = await walk(dir);

for (const file of files) {
    try {
        const content = await readFile(file, 'utf8');
        const newContent = content.replace(/opr\.mjs/g, 'ocx.mjs'); // Revert ocx.mjs to ocx.mjs

        if (content !== newContent) {
            await writeFile(file, newContent, 'utf8');
            console.log(`Updated ${file}`);
        }
    } catch (e) {
        // Not a text file or cannot read
    }
}
