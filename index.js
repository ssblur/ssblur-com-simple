// Compile all pages and render them to /out
const pug = require('pug')
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

let templateVariables = {}
let pagesToRender = [
    'index',
    'site'
]

for(let page of pagesToRender) {
    fs.writeFileSync(
        `./out/${page}.html`, 
        pug.compileFile(`./pages/${page}.pug`)(templateVariables)
    )
}

if(argv.dev) {
    console.log('Running in dev, starting server...')
    const express = require('express')
    const serve = require('express-static')

    const app = express();
    
    app.get('/', function(req, res) {
        res.redirect(`/index.html`);
    });
    app.use(serve(__dirname + '/out'))
    app.listen(8888, () => {})
}