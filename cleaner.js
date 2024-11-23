const findRemoveSync = require('find-remove')

setInterval(() => {
    var result = findRemoveSync('./libs', { age: { seconds: 30 }, extensions: '.ts' });
    console.log(result);
}, 500);
