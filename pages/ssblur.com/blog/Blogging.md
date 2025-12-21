## Update: there is a [follow-up](/blog/If-it-ain-t-broke.html) to this.

I like blogging, but only like, kinda. And less in the microbloggy “post-quips-online-to-cultivate-a-following” way but in the “maybe-my-journals-will-be-unearthed-in-a-millenium” way. And, to that end, I added Blogging to ssblur.com / blur.gay.

Of course, this site is not served dynamically and runs no clientside JavaScript. So how do I blog?

# What’s in a Blog?
So, to start blogging, I need to know what I want to do with a blog. And, for me, the answer is simple: write short articles on ventures of mine that I don’t document elsewhere.

Projects like this website! I’m not making a YouTube video on how I render a static site, that’s a bit mundane. But that doesn’t mean I won’t talk about it, I love talking about stuff! So, what can I do?

Well, I could keep doing what I do currently, which is writing pages individually by creating a new Pug file and editing it in VS Code. It’s a bit boring, but it works, and it’s quite powerful! I have all the powers that HTML and CSS normally afford me, and no real limits.

But that feels a bit boring, yeah? I want to make something, however small, to solve most of my problems. And the first step in making is deciding what I need it to do. For this, the objectives are simple:

- Write blog entries in a relatively nice editor
- Store some basic metadata about the article, such as roughly when it was written
- Not have to look at template source code every time I write something up
Well, actually, since it doesn’t need to be super complicated, I know something with great editor support...

# Rich Text Format
So there’s this great format, not sure if you’ve heard of it, called the Rich Text Format. Maybe you, like me, were exposed to it by opening WordPad instead of Notepad on the XP machine your family kept in the family den. Or maybe you just saw the option once in Microsoft Word and went “huh, weird” before clicking on .doc(x).

Well, it’s perfect for me here. I use LibreOffice for most of my writing tasks, from video scripts to drafting emails and letters, really anything I might need to write down with formatting. And, what do you know, it supports RTF.

And hey, I’m in luck, there’s even an NPM package to handle converting from RTF to HTML, [@iarna/rtf-to-html](https://github.com/iarna/rtf-to-html). 

Well that simplifies things! Now the last step is keeping that metadata, which seems simple enough! After all, most filesystems already store the sort of metadata I was thinking about, namely when files are created and updated.
But, uh, I don’t really think they fit my needs exactly. After all, I want the created date to reflect when the article was published, not when the file was created. In addition, I’d like to be able to tweak the details manually in case I ever have reason to, and while that’s possible with that sort of metadata it can be a pain.

Ultimately, I just stuck all the data into a JSON file in the blogs directory. Sure, it works.
# Puzzles and Pieces

So all that’s left is to slot everything together. I add a new loop to my rendering step that goes over each site, renders any RTF files in the blog section into an HTML file based on a base.pug template located in that folder, then have it load and update the metadata as necessary. I also threw the title in there so I can tweak the titles of articles as desired, since currently the titles are based on their file names. 

Not elegant, but it works.

And I love when things work.

# Or Not

So, everything seems great, right? This all works fine with small blog entries, so what could go wrong with bigger ones?

Symbols.

So, RTF documents embed invisible symbols that are meant to help with formatting. Things like which direction a quote should face, I think. IDK I’m not digging back into the specs for this and it’s been a while.

And normally, they, uh, crash this parser.

I get an error that reads like

```
Error: Encoding not recognized: 'SYMBOL' (searched as: 'symbol')
```

Ok, sure, I’ll just go digging around and look for that. 

Ah, yes, I see. In the flushHexStore function in the rtf-interpreter, there’s a little bit where it looks up symbols using iconv decode and the charset for this group. I’ll just bypass this for now if it errors, and we can circle back.
And it works! Kinda.

Now the document is full of question mark boxes everywhere, weird. It seems like they’re after every quote or bullet point, so I’d deduce these are those same formatting symbols. 

You know what I do remember about these? They all have a pretty consistent text representation, a backslash, single quote, and 2 numbers. Bet I could…

```
.replace(/\\'\d+/g, " ")
```

There we go. Just read the RTF file in, remove these characters, and forward to the formatter. It’s ugly, but you know what? It’s easier than working on someone else’s formatter. And it works.

I love it when things work.
