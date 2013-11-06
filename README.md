# Simple Doc Builder

## About

This is a small script to generate a static html page out of a specific
kind of markdown file. To try it out (it will parse this file,
`README.md`, just fine):

    git clone https://github.com/brianshourd/simple-doc-builder.git
    cd simple-doc-builder
    npm install
    node simple-doc-builder.js --input README.md \
        --template resources/defaultTemplate.html \ 
        --output readme.html

It's built to be used with `node` and `npm`, so make sure that you have
those installed.

## Reasoning

I had a couple of reasons for building this.

### Consistency

My markdown files always are written the same way. First-level header at
the top for the title, sections separated by second-level headers,
sub-sections separated by third-level headers with (sometimes)
fourth-level headers for subtitles. If you want an example - see this
file that you are reading right now.

Given that all my files look the same, I should be able to have a *bit*
more control over the output. Maybe build a table of contents. Maybe
some nice css styling.

Note that the fantastic [pandoc](http://johnmacfarlane.net/pandoc/) does
this, but the dependencies can be a bit large, and it is honestly far
too complex for the simplicity that I wanted. Which brings me to my next
reason.

### Ease of Install

I'm hooked on the way `npm` handles dependencies. It's pretty awesome.
Now I know that if I ever want to use this script again, I can just `npm
install` and I'm good.

### Third Reason
#### (Subtitle)

I actually don't have a third reason, I just wanted to include one for
the sake of using this README.md as a sample input.

## Usage

### Basic Usage

    node simple-doc-builder.js -i input.mkdn -t template.html -o output.html

There are three flags:

* -i | --input: Required. Signifies the input file. Should be a
  markdown-formatted file.
* -t | --template: Required. Signifies the template file. Should be an
  html file with [handlebars.js](http://handlebarsjs.com)-style
templates.
* -o | --output: Optional. The name of the file to output to (caution:
  overwrites!). If not supplied, output is piped to stdout.

### File Specifications

Your input file should follow a certain format. Some requirements:

* All headers are marked with the `'#'` notation, followed by a space.
  Other markdown-style header declarations are not allowed.
* First line is first-level header marked with `'# '`. There are no
  other first-level headers in the document.
* Immediately afterward, there is a second-level header marking the
  title of the first section. There may be as many second-level headers
in the document as you like.
* Between two first-level headers, there are zero or more third-level
  headers, specifying subsections.
* If a third-level header is followed by a fourth-level header, that
  header is considered to be a subtitle of the subsection.
* Reference-style linking won't work. All links must be of the form
  `[wikipedia](http://wikipedia.org)`.

Other than that, it just uses normal markdown. It uses
[markdown-js](https://github.com/evilstreak/markdown-js) with original,
Gruber-style markdown for markdown parsing.

### Templates

The script uses [Handlebars.js](http://handlebarsjs.com) for template
processing. The following object is passed to the template:

    {
        title: String,
        sections: [{
            title: String,
            id: String,
            body: String (HTML),
            subsections: [{
                title: String,
                subtitle: String,
                id: String,
                body: String (HTML)
            }]
        }]
    }

Note that the two `body` properties are strings that are already
properly formatted HTML. In particular, in your template, you have to
use the 'triple stache':

    {{#each subsections}}
    <div class="entry" id="{{id}}">
      <h3>{{title}} - {{subtitle}}</h3>
      <div class="body">
        {{{body}}}
      </div>
    </div>
    {{/each}}

A sample template is included (`resources/defaultTemplate.html`) - look
through that to see how some things work.

The way the ids are created guarantees that each id will be unique -
even if two sections/subsections have the same name (or stub to the same
name).

