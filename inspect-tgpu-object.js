const { tgpu } = require('typegpu');

console.log('--- tgpu object keys ---');
try {
    console.log(Object.keys(tgpu));
} catch (e) {
    console.error(e);
}

// Check for math functions specifically
const mathFuncs = ['add', 'sub', 'mul', 'div', 'max', 'min', 'length', 'smoothstep', 'discard'];
console.log('\n--- Math functions check ---');
mathFuncs.forEach(f => {
    console.log(`${f}: ${f in tgpu ? 'YES' : 'NO'}`);
});
