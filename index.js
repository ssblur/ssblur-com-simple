// Compile all pages and render them to /out
const pug = require('pug')
const fs = require('fs');

let templateVariables = {}
let pagesToRender = [
    'index'
]

for(let page of pagesToRender) {
    fs.writeFileSync(
        `./out/${page}.html`, 
        pug.compileFile(`./pages/${page}.pug`)(templateVariables)
    )
}




