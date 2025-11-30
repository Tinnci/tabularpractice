try {
    const std = require('typegpu/std');
    console.log('--- typegpu/std exports ---');
    console.log(Object.keys(std));
} catch (e) {
    console.log('typegpu/std does not exist');
}

try {
    const macro = require('typegpu/macro');
    console.log('--- typegpu/macro exports ---');
    console.log(Object.keys(macro));
} catch (e) {
    console.log('typegpu/macro does not exist');
}
