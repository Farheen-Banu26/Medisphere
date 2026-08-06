const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');
const componentsPath = path.join(__dirname, 'src', 'components');

const replacements = [
  { search: /bg-white/g, replace: 'bg-surface' },
  { search: /bg-gray-50/g, replace: 'bg-surface-2' },
  { search: /bg-gray-100/g, replace: 'bg-surface-2' },
  { search: /border-gray-100/g, replace: 'border-white/10' },
  { search: /border-gray-200/g, replace: 'border-white/10' },
  { search: /text-gray-900/g, replace: 'text-white' },
  { search: /text-gray-800/g, replace: 'text-gray-200' },
  { search: /text-gray-700/g, replace: 'text-gray-300' },
  { search: /text-gray-600/g, replace: 'text-gray-400' },
  { search: /text-gray-500/g, replace: 'text-gray-400' },
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Skip already updated files
      if (fullPath.endsWith('Dashboard.jsx') || fullPath.endsWith('Sidebar.jsx') || fullPath.endsWith('Navbar.jsx') || fullPath.endsWith('Layout.jsx')) continue;

      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
processDirectory(componentsPath);
console.log("Color replacement complete.");
