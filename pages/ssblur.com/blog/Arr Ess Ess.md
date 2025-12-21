
RSS is a cool technology, and one that has endured for a long time. I, personally use an RSS reader (Thunderbird, but prone to change) to keep up with a lot of socials and news sites that I just don't want to follow or check up on directly.

Feeds are great! If you want to follow a webcomic, RSS feeds are, in my opinion, the best option, but they're good for a lot of other stuff, too. Did you know that you can get an RSS feed to follow pretty much any YouTube channel? Check this out:

> [it's blur! YouTube Feed](https://www.youtube.com/feeds/videos.xml?channel_id=UC87-8FM-U9OSUYCzIqlhztA)

Neat, huh? It lists all the videos and such that came out on the channel, and even includes a bunch of useful data for consumers that want it, like a direct link, author information, info on when the video was last updated, and more. Cool stuff.

But that's not all! RSS is a ~**standard**\~, and a *lot* of people use it.

You know BlueSky? I do, it's my current social media of choice, and I tend to post little updates and stuff on there. Hell, you might've come from a post I made about this article *on* BlueSky. Well, it might not surprise you to know that it has RSS feeds for user feeds:

> [it's blur! BlueSky Feed](https://bsky.app/profile/did:plc:bdxlled5oqnjnzkbcnkpedoy/rss)

You can dig around and find example after example of sites that you might not think would have feeds, and the beauty of it is that if you have a feed for a site, you don't need to use their API to consume off of it! Just plug the feed URL into your reader of choice and you get nice, sorted feeds you can read through, without all the other nonsense your particular poison has. 

If you live in the US, you can get a feed of current weather conditions, hazards, and other useful bits from weather.gov. Here's a feed for Wilmington, NC, but you can get one for most airports and various other locations:

> [KILM Airport Weather Forecast](https://forecast.weather.gov/xml/current_obs/KILM.rss)

But you wanna know what the best part is? ***This site*** has a feed! That's right, baby, this whole thing was an elaborate setup for me to get to

## The Point

Because I love RSS so much, and because I've committed to posting on this blog more, I figured what better way to celebrate the technology by making an RSS feed for this blog. You can find it at [/blog/feed.xml](/blog/feed.xml) but that's not the interesting part.

The interesting part is that this site is *not* dynamically served. It's just files! The whole thing is statically generated when I update the site, gets pushed to S3 and neocities, and then gets cached by CloudFront for distribution. At no point does that involve any server rendering, particularly dynamic routing, or any other shenanigans.

So, how does an RSS feed work? Well, it, like most stuff transmitted via HTTP, is just a file. RSS version 2.0 is a well-defined spec under XML, specifically, but in the end it's still just a file. So statically generate it with the rest of the site, duh!

When I'm generating the blog articles, I'm already iterating through them and building a metadata table, so I can cache stuff like their creation date and edit things like their title. *And* I already use that to generate the blogs list for the front page and [/blog/](/blog/). So just iterate over that same object to make an RSS feed, easy.

For this task, I only needed a basic XML generator. I *could've* rolled one myself, or just used Pug templates to generate the RSS, but honestly this was just more fun for me. This time, I used 
[xml-js](https://github.com/nashwaan/xml-js), 
a straightforward library intended to convert between JS Objects, JSON, and XML.

And thanks to that simplicity, and already having most of the data I needed for this lying around, I can pretty much show you the whole diff right here:

```js
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
                    description: { _text: m.teaser },
                    pubDate: { _text: new Date(m.created).toUTCString() }
                })).slice(0, 9)
            }
        }
    }, {compact: true,});
    fs.writeFileSync(`./out${siteName}blog/feed.xml`, rss)
```

This is a bit bare-bones, but it gets all the info you need in there: RSS version, the blog channel info, and a list of all the blog posts with titles, descriptions, a hyperlink, and creation date. After a second I also added a slice to the end so it wouldn't grow infinitely as I posted more stuff.

Just write that to feed.xml in the rendered webpage output directory and it'll get pushed with the rest of the site after rendering. 

And you can even check it out, since you're already on the site!

> [The Feed](/blog/feed.xml) (I know I already linked it but it was relevant again, ok?)

But this is just the beginning of my devious machinations, there is much to be done with RSS. I have big things planned, big things...