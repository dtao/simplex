# Simplex

```javascript
Simplex('name=value').match('foo=bar');
// => { name: 'foo', value: 'bar' }
```

## Simpler than regular expressions

Let's say you have some text like this:

    Bob 35 (M)
    Suzie 42 (F)
    Phil 29 (M)
    Marlene 26 (F)

Quick! Can you write some code to parse those lines using a regular expression?

```javascript
var pattern = /(\w+) (\d+) \(([MF])\)/g,
    people  = [],
    match;

while (match = pattern.exec(text)) {
  people.push({
    name: match[1],
    age: match[2],
    gender: match[3]
  });
}
```

Not too bad. But this is a very simple pattern-matching problem, the code seems
to be more complex than it needs to be.

This scenario---matching simple patterns---is what **Simplex** is designed for.
Check it out:

```javascript
var simplex = new Simplex('name age (gender)', 'g').match(text);
```

Same result as above.

## Usage

We've looked a couple of simple examples already. Here are a few more, with some
features we haven't already covered.

By default Simplex treats every word-like token as a *placeholder* to be matched
against a single word. So:

```javascript
Simplex('first middle last').match('Daniel Lincoln Tao');
// => { first: 'Daniel', middle: 'Lincoln', last: 'Tao' };

Simplex('year/month/day').match('2014/02/10');
// => { year: 2014, month: 2, day: 10 }
```

If you want a placeholder to represent multiple words, append the `*` character:

```
Simplex('"words*"').match('and he was like "blah blah blah" and i was like');
// => { words: 'blah blah blah' }
```

The `Simplex` constructor (which can be called with or without `new`) takes an
optional `options` object as its second argument. You can also express some
options in a convenient shorthand (just like with the `RegExp` constructor).

Right now the only meaningful option is `global`. Set to `true` to get *all*
matches from a string instead of the first match---just like with regular
expressions.

```javascript
Simplex('(x, y)', 'g').match('(1, 2) (3, 4)');
// => [{ x: 1, y: 2 }, { x: 3, y: 4 }]
```
