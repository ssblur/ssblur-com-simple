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

