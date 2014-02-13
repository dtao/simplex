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

The `Simplex` constructor (which can be called with or without `new`) takes two
arguments: a *pattern expression* (required) and an optional `options` object.

```javascript
var simplex = new Simplex('expression', { /* options */ });
```

The `match` method takes a string, matches it against the given pattern, and
returns the first result. To return an array of *all* results, use `matchAll`.

## How it works

A *pattern expression* consists of *fields* that will be matched. For example,
take this expression:

    term (type) def*

The *fields* are `term`, `type`, and `def`. When you call `match`, Simplex will
look for a word where each field is. The '\*' after `def` tells Simplex to match
(potentially) *multiple* words for that field.

When all fields are matched, the result will be an object whose keys are the
names of the fields, and whose values are the matches:

```javascript
Simplex('term (type) def*').match('coffee (noun) a tasty hot beverage');
// => { term: 'coffee', type: 'noun', def: 'a tasty hot beverage' }
```

By default Simplex treats every *word-like* token as a field. This means
letters, numbers, and underscores (same as with regular expressions). If you
want to represent fields differently, supply the `fieldMarkers` option:

```javascript
// Here we need to use field markers so that the first 'format' below isn't
// treated as a field
Simplex('--format=<format>', { fieldMarkers: '<>' })
  .match('--format=html');
// => { format: 'html' }

// We also need to use field markers for multi-word fields
Simplex('[silly greeting*], Mark!', { fieldMarkers: '[]' })
  .match('Oh hai, Mark!');
// => { 'silly greeting': 'Oh hai' }
```

Consider the first example above. Notice we specified the string `'<>'`. This
tells Simplex that placeholders start with `'<'` and end with `'>'`. This works
with any string; Simplex will take the first half as the left marker, and the
second half as the right.

```javascript
Simplex('<div>{{content*}}</div>', { fieldMarkers: '{{}}' })
  .match('<div>Hello, world!</div>');
// => { content: 'Hello, world!' }
```

For strings with an odd number of characters, the assumption is that the middle
character goes on both sides.

```javascript
Simplex('Roses are <*rose color*>', { fieldMarkers: '<*>' })
  .match('Roses are red');
// => { 'rose color': 'red' }
```

## Options

By default, Simplex does some very basic type inference for numbers and boolean
values.

```javascript
Simplex('year/month/day').match('2014/02/10');
// => { year: 2014, month: 2, day: 10 }

Simplex('--verbose=<verbose>', { fieldMarkers: '<>' })
  .match('--verbose=true');
// => { verbose: true }
```

This isn't configurable yet, but it will be!

### Whitespace

By default Simplex is *lenient* with whitespace, meaning every space in a
pattern expression matches any number of spaces.

```javascript
Simplex('salutation valediction').match('hello     goodbye');
// => { salutation: 'hello', valediction: 'goodbye' }
```

Enable the `strictWhitespace` option to make it *strict*, so that whitespace
must be matched exactly.

```javascript
var simplex = new Simplex('first \tlast', { strictWhitespace: true });

simplex.match('joe schmoe');   // => null
simplex.match('joe\tschmoe');  // => null
simplex.match('joe \tschmoe'); // => { first: 'joe', last: 'schmoe' }
```

Questions? [Open a ticket!](https://github.com/dtao/simplex/issues)

This library is a work in progress.
