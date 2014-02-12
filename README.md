# Simplex

```javascript
Simplex('name=value').match('foo=bar');
// => { name: 'foo', value: 'bar' }
```

## Simpler than regular expressions

Let's say you have some text like this:

    Bob     35 (M)
    Suzie   42 (F)
    Phil    29 (M)
    Marlene 26 (F)

Quick! Can you write code to parse those lines using a regular expression?

```javascript
var pattern = /(\w+)\s+(\d+)\s+\(([MF])\)/g,
    people  = [],
    match;

while (match = pattern.exec(text)) {
  people.push({
    name: match[1],
    age: Number(match[2]),
    gender: match[3]
  });
}

console.log(people);
// [ { name: 'Bob', age: 35, gender: 'M' },
//   { name: 'Suzie', age: 42, gender: 'F' },
//   { name: 'Phil', age: 29, gender: 'M' },
//   { name: 'Marlene', age: 26, gender: 'F' } ]
```

Not too bad. But for such a simple pattern-matching problem, that feels like
more code than we ought to need.

This scenario---matching simple patterns---is what **Simplex** is designed for.
Check it out:

```javascript
var people = Simplex('name age (gender)').matchAll(text);

console.log(people);
// [ { name: 'Bob', age: 35, gender: 'M' },
//   { name: 'Suzie', age: 42, gender: 'F' },
//   { name: 'Phil', age: 29, gender: 'M' },
//   { name: 'Marlene', age: 26, gender: 'F' } ]
```

Way easier!

## Usage

We've looked at a couple of simple examples already. You use `match` to get a
single match, `matchAll` to get all matches. Now here's some more info we
haven't covered yet.

By default Simplex treats every *word-like* token as a placeholder to be matched
against a single word. This means letters, numbers, and underscores (same as
with regular expressions). So:

```javascript
Simplex('first middle last').match('Daniel Lincoln Tao');
// => { first: 'Daniel', middle: 'Lincoln', last: 'Tao' };
```

If you want a placeholder to represent *multiple* words, add the '*' suffix:

```javascript
Simplex('"quoted*"')
  .match('...he was like "blah blah blah" and I was like...');
// => { quoted: 'blah blah blah' }
```

Now, this is all great when every word-like token in the source should be a
placeholder. Sometimes that isn't the case. If you want/need to be more explicit
about where the placeholders are, you can specify the `fieldMarkers` option to
the `Simplex` constructor (which can be called with or without `new`).

```javascript
Simplex('--format=<format>', { fieldMarkers: '<>' })
  .match('--format=html');
// => { format: 'html' }
```

Notice we specified the string `'<>'`. This tells Simplex that placeholders
start with `'<'` and end with `'>'`. This works with any string with an even
number of characters; Simplex will take the first half as the left marker, and
the second half as the right:

```javascript
Simplex('<div>{{message*}}</div>', { fieldMarkers: '{{}}' })
  .match('<div>Hello, world!</div>');
// => { message: 'Hello, world!' }
```

By default, it also does some very basic type inference for numbers and boolean
values.

```javascript
Simplex('year/month/day').match('2014/02/10');
// => { year: 2014, month: 2, day: 10 }

Simplex('--verbose=<verbose>', { fieldMarkers: '<>' })
  .match('--verbose=true');
// => { verbose: true }
```

Questions? [Open a ticket!](https://github.com/dtao/simplex/issues)

This library is a work in progress.
