// Compile all pages and render them to /out
import pug from 'pug'
import fs from 'fs'
import glob from 'glob'
import minimist from 'minimist'
import express from 'express'
import serve from 'express-static'
import { marked } from 'marked'
import convert from 'xml-js'
import crypto from 'crypto'

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

function compiledExtension(name) {
    return name.endsWith('.pug') || name.endsWith('.md')
}

copyFilesFrom('./pages/shared', './out/shared', false, name => !compiledExtension(name))

for(let folder of glob.sync('./pages/*')) {
    if(folder.endsWith('base') || folder.endsWith('shared')) continue
    let dirname = folder.substring(7)
    console.log('copying from ' + folder + ' to ' + `./out/${dirname}`)
    copyFilesFrom(folder, `./out/${dirname}`, true, name => !compiledExtension(name))
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
        let link = fileName.replace(/[^A-Za-z0-9\/]/g, '-')
        let blogTitle = fileName.split("/")
        blogTitle = blogTitle[blogTitle.length - 1]
        let blogContents = marked.parse(fs.readFileSync(blog, { encoding: 'utf8', flag: 'r' }))

        meta[blog] ??= {}
        meta[blog].path = blog
        meta[blog].created ??= (new Date()).toISOString()
        
        meta[blog].link = `/blog/${link}.html`
        meta[blog].title ??= blogTitle
        meta[blog].teaser ??= blogContents.replace(/<.*?>/g, '').substring(0, 280).replace(/&...;/, '').replace(/\s+.*?$/, '') + "..."

        let hash = crypto.createHash('sha1').update(blogContents).digest('base64')
        if((meta[blog].hash ?? hash) != hash) {
            meta[blog].updated = (new Date()).toISOString()
        }
        meta[blog].hash = hash

        let created = new Date(meta[blog].created).toLocaleString("en-US")
        let teaser = meta[blog].teaser

        fs.writeFileSync(
            `./out${siteName}blog/${link}.html`, 
            template({...meta[blog], contents: blogContents}), 
            { encoding: 'utf8' }
        )
    }

    let rss = convert.js2xml({
        _declaration: {
            _attributes: {
                version: "1.0",
                encoding: "utf-8"
            }
        },
        rss: {
            _attributes: { version: "2.0" },
            channel: {
                title: { _text: "it's blur blog" },
                link: { _text: `https:/${siteName}blog/index.html` },
                description: { _text: "The infrequently-updated blog of blur"},
                item: Object.values(meta).sort((a, b) => new Date(b.created) - new Date(a.created)).map(m => ({
                    title: { _text: m.title },
                    link: { _text: `https:/${siteName}${m.link.substring(1)}` },
                    guid: { _text: `https:/${siteName}${m.link.substring(1)}` },
                    description: { _text: m.teaser },
                    pubDate: { _text: new Date(m.created).toUTCString() },
                })).slice(0, 9)
            }
        }
    }, {compact: true,});
    fs.writeFileSync(`./out${siteName}blog/feed.xml`, rss)

    templateVariables.blogs = Object.values(meta)
        .filter((blog) => fs.existsSync(blog.path))
        .sort((blog) => blog.created)
        .reverse()
        .map((blog) => {
            blog = {...blog}
            blog.created = new Date(blog.created).toLocaleString("en-US")
            if(blog.updated) blog.updated = new Date(blog.updated).toLocaleString("en-US")
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