const d = require('typegpu/data');
const { tgpu } = require('typegpu');

const mathFuncs = ['add', 'sub', 'mul', 'div', 'max', 'min', 'length', 'smoothstep', 'discard', 'abs', 'sin', 'cos'];

console.log('--- typegpu/data check ---');
mathFuncs.forEach(f => {
    console.log(`${f}: ${f in d ? 'YES' : 'NO'}`);
});

console.log('\n--- tgpu["~unstable"] check ---');
const unstable = tgpu['~unstable'];
if (unstable) {
    console.log(Object.keys(unstable));
}
