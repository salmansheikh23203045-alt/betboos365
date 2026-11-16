const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'docs'),
  path.join(__dirname, 'server/docs'),
  path.join(__dirname, 'server/prisma')
];

const rootFiles = [
  path.join(__dirname, 'package.json'),
  path.join(__dirname, 'server/package.json'),
  path.join(__dirname, 'PRODUCTION_DEPLOYMENT_REPORT.md'),
  path.join(__dirname, 'DEPLOYMENT_READINESS_AUDIT.md'),
  path.join(__dirname, 'CLAUDE_PROJECT_STATE.md'),
  path.join(__dirname, 'render.yaml')
];

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.next' || file === 'migrations-pg' || file === 'migrations') continue;
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

let allFiles = [...rootFiles];
for (const dir of targetDirs) {
  allFiles = allFiles.concat(walk(dir));
}

let updatedCount = 0;
for (const file of allFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace TCL11 case-insensitively or exact
  // We want to replace TCL11 -> BetBoos365
  // and tcl11 -> betboos365 (in text/descriptions)
  // But avoid changing code identifiers like table names or db fields if any
  newContent = newContent.replace(/TCL11/g, 'BetBoos365');
  newContent = newContent.replace(/tcl11/g, 'betboos365');

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${path.relative(__dirname, file)}`);
    updatedCount++;
  }
}

console.log(`Total files updated: ${updatedCount}`);
