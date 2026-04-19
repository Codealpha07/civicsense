const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2] || '.';
const dependencies = new Set();
const packageJsonPath = path.join(rootDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found');
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const declaredDeps = new Set(Object.keys(packageJson.dependencies || {}));
const builtinModules = new Set(['fs', 'path', 'crypto', 'os', 'http', 'https', 'stream', 'util', 'url', 'events', 'zlib', 'child_process', 'cluster', 'dns', 'net', 'readline', 'repl', 'tls', 'vm', 'worker_threads']);

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walk(fullPath);
            }
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.matchAll(/require\(["']([^"']+)["']\)/g);
            for (const match of matches) {
                const source = match[1];
                if (!source.startsWith('.') && !source.startsWith('/') && !builtinModules.has(source)) {
                    // Extract package name (handle @scoped/package or package/subpath)
                    let pkgName = source;
                    if (source.startsWith('@')) {
                        pkgName = source.split('/').slice(0, 2).join('/');
                    } else {
                        pkgName = source.split('/')[0];
                    }
                    dependencies.add(pkgName);
                }
            }
        }
    }
}

walk(rootDir);

const missing = [];
for (const dep of dependencies) {
    if (!declaredDeps.has(dep)) {
        missing.push(dep);
    }
}

console.log('Detected dependencies:', Array.from(dependencies).sort());
console.log('Declared dependencies:', Array.from(declaredDeps).sort());
console.log('MISSING dependencies:', missing);
