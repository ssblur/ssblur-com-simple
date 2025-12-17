// Compile all pages and render them to /out
import pug from 'pug'
import fs from 'fs'
import glob from 'glob'
import minimist from 'minimist'
import express from 'express'
import serve from 'express-static'
import { marked } from 'marked'

const argv = minimist(process.argv.slice(2))

try {
    fs.rmSync('./out', {recursive: true})
} catch (e) {}

let templateVariables = {
    name: "Pat Hallbick"
}

let files = glob.sync('data/finances/*.csv')
let finances = []
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
})
let grandTotal = 0
for(let filename of files) { // All of this is to ensure the latest are at the top when rendering.
    let total = 0
    let contents = fs.readFileSync(filename).toString()
    let data = []
    for(let line of contents.split('\n')) {
        let datum = line.split(',')
        let x = Number.parseFloat(datum[1])
        if(Number.isNaN(x) || x == 0) continue;
        total += x
        grandTotal += x
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
    let date = new Date()
    date.setDate(1)
    date.setMonth(Number.parseInt(month[1]) - 1)
    month = date.toLocaleString("en-us", { month: "long" });
    finances.push([
        `${month} ${year}`,
        data
    ])
}
templateVariables.finances = finances.reverse()
templateVariables.grandTotal = (grandTotal > 0 ? "earned " : "spent ")
    + formatter.format(Math.abs(grandTotal))

function getDirname(filename) {
    filename = filename.split('/')
    filename.pop()
    return filename.join('/')
}

function copyFilesFrom(from, to, overwrite, filter) {
    if(!filter)
        filter = name => true
    for(let file of glob.sync(`${from}/*`)) {
        let filename = file.substring(from.length)
        let dirname = getDirname(filename)

        if(!filter(filename)) continue

        if(fs.statSync(file).isDirectory()) {
            copyFilesFrom(file, `${to}${filename}`, overwrite, filter)
        } else if(overwrite || !fs.existsSync(`${to}/${filename}`)) {
            console.log(`${file} --> ${to}${filename}`)
            fs.mkdirSync(`${to}${dirname}`, {recursive: true})
            fs.copyFile(file, `${to}${filename}`, () => {})
        }
    }
}

copyFilesFrom('./pages/shared', './out/shared', false, name => !name.endsWith('.pug'))

for(let folder of glob.sync('./pages/*')) {
    if(folder.endsWith('base') || folder.endsWith('shared')) continue
    let dirname = folder.substring(7)
    console.log('copying from ' + folder + ' to ' + `./out/${dirname}`)
    copyFilesFrom(folder, `./out/${dirname}`, true, name => !name.endsWith('.pug'))
}

for(let site of glob.sync('./pages/*/')) {
    if(site.includes('/base/')) continue

    if(!fs.existsSync(`${site}blog/base.pug`)) {
        console.log(`Site at ${site} does not have a blog template, skipping blog entry rendering...`)
        console.log(`(Template expected at '${site}blog/base.pug')`)
        continue
    }

    let meta
    try {
        meta = JSON.parse(fs.readFileSync(`${site}blog/meta.json`, { encoding: 'utf8', flag: 'r' }))
    } catch {
        meta = {}
    }

    let siteName = site.substring(7)
    const start = `${site}blog/`.length
    const template = pug.compileFile(`${site}blog/base.pug`)
    for(let blog of glob.sync(`${site}blog/**/*.md`)) {
        let fileName = blog.substring(start, blog.length - 3)
        let link = fileName.replace(/[^A-Za-z]/g, '-')
        let blogTitle = fileName.split("/")
        blogTitle = blogTitle[blogTitle.length - 1]
        let blogContents = marked.parse(fs.readFileSync(blog, { encoding: 'utf8', flag: 'r' }))

        meta[blog] = meta[blog] ?? {}
        meta[blog].path = blog
        meta[blog].created = meta[blog].created ?? (new Date()).toISOString()
        meta[blog].link = `/blog/${link}.html`
        meta[blog].title = meta[blog].title ?? blogTitle
        meta[blog].teaser = blogContents.replace(/<.*?>/g, '').substring(0, 280).replace(/\s+.*?$/, '') + "..."

        let created = new Date(meta[blog].created).toLocaleString("en-US")

        fs.writeFileSync(`./out${siteName}blog/${link}.html`, template({blogTitle, blogContents, created}), { encoding: 'utf8' })
    }

    templateVariables.blogs = Object.values(meta)
        .filter((blog) => fs.existsSync(blog.path))
        .sort((blog) => blog.created)
        .reverse()
        .map((blog) => {
            blog.created = new Date(blog.created).toLocaleString("en-US")
            return blog
        })

    fs.writeFileSync(`${site}blog/meta.json`, JSON.stringify(meta, null, 2), { encoding: 'utf8' })
}

for(let page of glob.sync('./pages/**/*.pug')) {
    if(page.includes('/base/')) continue

    console.log(page)
    const pageName = page.substring(7, page.length - 4)

    let dir = pageName.split('/')
    dir.pop()
    dir = dir.join('/')
    fs.mkdirSync(`./out${dir}`, {recursive: true})

    fs.writeFileSync(
        `./out${pageName}.html`, 
        pug.compileFile(`${page}`)(templateVariables)
    )
}

for(let site of glob.sync('./out/*')) {
    copyFilesFrom('./out/shared', site, false)
}

if(argv.dev) {
    console.log('Running in dev, starting server...')

    let port = 8888
    for(let site of glob.sync('out/*')) {
        if(site.endsWith('shared') || site.endsWith('base')) continue
        const app = express()
        
        app.get('/', function(req, res) {
            res.redirect(`/index.html`)
        });
        app.use(serve(site))
        let p = port
        app.listen(port, () => {
            console.log(`Serving site ${site} at http://127.0.0.1:${p}`)
        })
        port++;
    }
}