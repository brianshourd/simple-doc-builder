var fs = require('fs');
//var process = require('process');
var md = require('markdown').markdown;
var handlebars = require('handlebars');
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

// Set optimist to handle possible flags
var usageStr = 'Usage:\n  node parse.js -i input.mkdn -t template.html -o output.html';
var argv = require('optimist')
    .usage(usageStr)
    .alias('i', 'input')
    .describe('i', 'Input file (markdown)')
    .alias('t', 'template')
    .describe('t', 'Template file (handlebars-style html)')
    .alias('o', 'output')
    .describe('o', 'Output file (defaults to stdout)')
    .demand(['i', 't'])
    .argv;

// Global lookup reference for header levels
var headerLevels = ['', '# ', '## ', '### ', '#### ', '##### '];

var config = {
    source: 'index.mkdn',
    template: 'resources/pageTemplate.html',
};

// Turns a title into a slug, used for its id. Stores ids, so that the
// same id doesn't get used twice, instead appending a number
var getId = (function() {
    ids = {};
    return function(title) {
        var slug = _.slugify(title);
        var count = ids[slug];
        if (count) { 
            ids[slug] += 1;
            slug += count;
        } else {
            ids[slug] = 1;
        }
        return slug;
    };
}());

function extractByHeader(level, lines) {
    // Create the delimiter from the level
    /*
    var delim = [];
    _.times(level, function() { delim.push('#'); });
    delim = delim.join('') + ' ';
    */
    var delim = headerLevels[level];

    var marks = [];
    var chunks = [];
    _.each(lines, function(line, index) {
        if (_.startsWith(line, delim)) {
            marks.push(index);
        }
    });
    marks.push(lines.length);
    //console.log(marks);
    for (var i = 1; i < marks.length; i++) {
        chunks.push(lines.slice(marks[i-1], marks[i]));
    }
    return {
        before: lines.slice(0, marks[0]),
        chunks: chunks
    };
}

// Goal: given a section (lines), turn it into a better formatted piece
// of data:
// { body: str (html),
//   title: str,
//   id: str,
//   subsections: [{
//      title: str,
//      subtitle: str,
//      id: str,
//      body: str (html)
//   }]
// }
function processSection(lines) {
    var section = extractByHeader(3, lines);
    var ret = {};
    var dlines = section.before;
    ret.title = _.trim(dlines[0], headerLevels[2]);
    dlines = _.tail(dlines);
    ret.body = md.toHTML(dlines.join('\n'));
    ret.id = getId(ret.title);
    ret.subsections = _.map(section.chunks, processEntry);
    return ret;
}

// Given an entry (lines), turn it into
// { title: str,
//   subtitle: str,
//   id: str,
//   body: str (html)
// }
function processEntry(lines) {
    var title = _.trim(lines[0], headerLevels[3]);
    lines = _.tail(lines);
    var subtitle = '';
    if (_.startsWith(lines[0], headerLevels[4])) {
        subtitle = _.trim(lines[0], headerLevels[4]);
        lines = _.tail(lines);
    }
    return {
        title: title,
        subtitle: subtitle,
        id: getId(title),
        body: md.toHTML(lines.join('\n'))
    };
}

function create(inputFile, templateFile) {
    // Load up entries.mkdn, parse
    var index = fs.readFileSync(inputFile, {encoding: 'utf8'});
    var lines = _.lines(_.ltrim(index, '\n'));

    // Get the title
    var doc = {};
    if (_.startsWith(lines[0], headerLevels[1])) {
        doc.title = _.trim(lines[0], headerLevels[1]);
    } else {
        doc.title = 'Unknown Title';
    }

    // Get the top-level sections
    doc.sections = extractByHeader(2, lines).chunks;

    // In each section, split by subsections
    doc.sections = _.map(doc.sections, processSection);

    var template = handlebars.compile(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    return template(doc);
}

var output = create(argv.input, argv.template);
if (argv.output) {
    fs.writeFileSync(argv.output, output);
} else {
    console.log(output);
}

/*
var output = create(config.source, config.template);
console.log(output);
*/

