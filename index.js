// Compile all pages and render them to /out
const pug = require('pug')
const fs = require('fs');
const { sync: glob } = require('glob');
const argv = require('minimist')(process.argv.slice(2));

let templateVariables = {}
let pagesToRender = [
    'index',
    'site',
    'projects',
    'transparency'
]

let files = glob('data/finances/*.csv')
let finances = []
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
})
for(let filename of files) { // All of this is to ensure the latest are at the top when rendering.
    let total = 0
    let contents = fs.readFileSync(filename).toString()
    let data = []
    for(let line of contents.split('\n')) {
        datum = line.split(',')
        x = Number.parseFloat(datum[1])
        total += x
        data.push([
            datum[0],
            formatter.format(x),
            datum[2]
        ])
    }
    data.push([
        'Total',
        formatter.format(total),
        ''
    ])
    let month = filename.split('/')[2].split('.')[0].split('-')
    let year = month[0]
    date = new Date()
    date.setDate(1)
    date.setMonth(Number.parseInt(month[1]) - 1)
    month = date.toLocaleString("en-us", { month: "long" });
    finances.push([
        `${month} ${year}`,
        data
    ])
}
templateVariables.finances = finances.reverse()

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