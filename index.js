// Compile all pages and render them to /out
const pug = require('pug')
const fs = require('fs')
const { sync: glob } = require('glob')
const argv = require('minimist')(process.argv.slice(2))

try {
    fs.rmSync('./out', {recursive: true})
} catch (e) {}

let templateVariables = {
    name: "Patrick Guyas-King"
}

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

function getDirname(filename) {
    filename = filename.split('/')
    filename.pop()
    return filename.join('/')
}

function copyFilesFrom(from, to, overwrite, filter) {
    if(!filter)
        filter = name => true
    for(let file of glob(`${from}/*`)) {
        let filename = file.substring(from.length)
        let dirname = getDirname(filename)

        if(!filter(filename)) continue

        if(fs.statSync(file).isDirectory()) {
            copyFilesFrom(file, `${to}${filename}`, overwrite)
        } else if(overwrite || !fs.existsSync(`${to}/${filename}`)) {
            console.log(`${file} --> ${to}${filename}`)
            fs.mkdirSync(`${to}${dirname}`, {recursive: true})
            fs.copyFile(file, `${to}${filename}`, () => {})
        }
    }
}

function compileFilesFrom(dir) {
    for(let page of glob(`./pages/${dir}/**/*.pug`)) {
        fs.writeFileSync(
            `./out/${page}.html`, 
            pug.compileFile(`./pages/${page}.pug`)(templateVariables)
        )
    }
}

copyFilesFrom('./pages/shared', './out/shared', false, name => !name.endsWith('.pug'))

for(let folder of glob('./pages/*')) {
    if(folder.endsWith('base') || folder.endsWith('shared')) continue
    let dirname = folder.substring(7)
    console.log('copying from ' + folder + ' to ' + `./out/${dirname}`)
    copyFilesFrom(folder, `./out/${dirname}`, true, name => !name.endsWith('.pug'))
}

for(let page of glob('./pages/**/*.pug')) {
    if(page.includes('/base/')) continue

    console.log(page)
    pageName = page.substring(7, page.length - 4)

    let dir = pageName.split('/')
    dir.pop()
    dir = dir.join('/')
    fs.mkdirSync(`./out${dir}`, {recursive: true})

    fs.writeFileSync(
        `./out${pageName}.html`, 
        pug.compileFile(`${page}`)(templateVariables)
    )
}

for(let site of glob('./out/*')) {
    copyFilesFrom('./out/shared', site, false)
}

if(argv.dev) {
    console.log('Running in dev, starting server...')
    const express = require('express')
    const serve = require('express-static')

    let port = 8888
    for(let site of glob('out/*')) {
        if(site.endsWith('shared') || site.endsWith('base')) continue
        const app = express()
        
        app.get('/', function(req, res) {
            res.redirect(`/index.html`)
        });
        app.use(serve(site))
        app.listen(port, () => {
            console.log(`Serving site ${site} on port ${port}`)
        })
        port++;
    }
}