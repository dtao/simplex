/**
 * Simplex: Simpler than regular expressions
 */

/**
 * @typedef {Object} SimplexOptions
 * @property {boolean} global
 * @property {FieldIdentifiers} fieldIdentifiers
 */
var SimplexOptions;

/**
 * @typedef {Object} FieldIdentifiers
 * @property {string} left
 * @property {string} right
 */
var FieldIdentifiers;

/**
 * @typedef {Object} MatchData
 * @property {number} index
 * @property {number} length
 */
var MatchData;

/**
 * A `Simplex` is sort of like a `RegExp` but simpler. The easiest way to
 * explain this is by example; see the docs for more info.
 *
 * @constructor
 * @param {string} expression
 * @param {SimplexOptions|string} options
 */
function Simplex(expression, options) {
  if (!(this instanceof Simplex)) {
    return new Simplex(expression, options);
  }

  this.options = parseOptions(options || {});
  this.matcher = createMatcher(expression, this.options);
}

Simplex.prototype = {
  /**
   * Parses the given text to an object whose keys are the names of the
   * word-like tokens in the source expression for this {@link Simplex}, and
   * whose associated values are the matches for those tokens.
   *
   * @param {string} text
   * @returns {Object}
   *
   * @example
   * Simplex('a=b(c) d/e').match('foo=bar(baz) yes/no'); // => {
   *   a: 'foo',
   *   b: 'bar',
   *   c: 'baz',
   *   d: 'yes',
   *   e: 'no'
   * }
   *
   * Simplex('pairName=[x,y]', 'g').match('foo=[a,b]&bar=[c,d]'); // => [
   *   {
   *     pairName: 'foo',
   *     x: 'a',
   *     y: 'b'
   *   },
   *   {
   *     pairName: 'bar',
   *     x: 'c',
   *     y: 'd'
   *   }
   * ]
   */
  match: function match(text) {
    if (this.options.global) {
      return this.matchAll(text);
    }

    var regexMatch = text.match(this.matcher.pattern);
    if (!regexMatch) {
      return null;
    }
    return mapMatch(regexMatch, this.matcher.map);
  },

  matchAll: function matchAll(text) {
    var pattern = new RegExp(this.matcher.pattern.source, 'g'),
        map     = this.matcher.map,
        regexMatch;

    var results = [];
    while (regexMatch = pattern.exec(text)) {
      results.push(mapMatch(regexMatch, map));
    }

    return results;
  }
};

/**
 * @private
 * @param {MatchData} match
 * @param {Array.<string>} map
 *
 * @example
 * var match = 'foo=bar'.match(/(\w+)=(\w+)/);
 * mapMatch(match, ['name', 'value']); // => { name: 'foo', value: 'bar' }
 */
function mapMatch(match, map) {
  var data = {};
  for (var i = 0, len = map.length; i < len; ++i) {
    if (i > match.length) {
      break;
    }
    data[map[i]] = match[i + 1];
  }
  return data;
}

/**
 * @private
 * @param {string} expression
 * @param {SimplexOptions} options
 *
 * @example
 * createMatcher('name=value', {});
 * // => {
 *   pattern: /(\w+)=(\w+)/,
 *   map: ['name', 'value']
 * }
 *
 * createMatcher('{ name: value }', {});
 * // => {
 *   pattern: /\{ (\w+): (\w+) \}/,
 *   map: ['name', 'value']
 * }
 *
 * createMatcher('[name] foo [value]', { fieldIdentifiers: '[]' });
 * // => {
 *   pattern: /\[(\w+)\] foo \[(\w+)\]/,
 *   map: ['name', 'value']
 * }
 */
function createMatcher(expression, options) {
  var fieldIdentifiers = parseFieldIdentifiers(options.fieldIdentifiers),
      tokenMatcher = getTokenMatcher(fieldIdentifiers),
      tokenMatch,
      pattern = '',
      index = 0,
      map = [];

  while (tokenMatch = tokenMatcher.exec(expression)) {
    pattern += escapeRegex(expression.substring(index, tokenMatch.index) + fieldIdentifiers.left);
    pattern += '(\\w+)';
    pattern += escapeRegex(fieldIdentifiers.right);

    index = tokenMatch.index + tokenMatch[0].length;
    map.push(tokenMatch[1]);
  }

  if (index < expression.length - 1) {
    pattern += escapeRegex(expression.substring(index));
  }

  return {
    pattern: new RegExp(pattern),
    map: map
  };
}

/**
 * @private
 * @param {Array.<string>|Object|string} input
 * @return {FieldIdentifiers}
 *
 * @example
 * parseFieldIdentifiers(null);                     // => { left: '', right: '' }
 * parseFieldIdentifiers('[]');                     // => { left: '[', right: ']' }
 * parseFieldIdentifiers('{{}}');                   // => { left: '{{', right: '}}' }
 * parseFieldIdentifiers(['a', 'b']);               // => { left: 'a', right: 'b' }
 * parseFieldIdentifiers({ left: '*', right: '!'}); // => { left: '*', right: '!'}
 */
function parseFieldIdentifiers(input) {
  if (typeof input === 'string') {
    return {
      left: input.substring(0, input.length / 2),
      right: input.substring(input.length / 2)
    };
  }

  if (input instanceof Array) {
    return {
      left: input[0],
      right: input[1]
    };
  }

  input = (typeof input === 'object' && input) || {};

  return {
    left: input.left || '',
    right: input.right || ''
  };
}

/**
 * @private
 * @param {FieldIdentifiers} fieldIdentifiers
 * @returns {RegExp}
 *
 * @example
 * getTokenMatcher(parseFieldIdentifiers('{}')); // => /\{(\w+)\}/g
 * getTokenMatcher({}); // => /(\w+)/g
 */
function getTokenMatcher(fieldIdentifiers) {
  if (!fieldIdentifiers) {
    return /(\w+)/g;
  }

  var left  = fieldIdentifiers.left,
      right = fieldIdentifiers.right;

  return new RegExp(escapeRegex(left) + '(\\w+)' + escapeRegex(right), 'g');
}

/**
 * @private
 * @param {string} source
 *
 * @example
 * escapeRegex('^hi$'); // => '\\^hi\\$'
 */
function escapeRegex(source) {
  return (source || '').replace(/([\(\)\[\]\{\}\^\$])/g, '\\$1');
}

/**
 * @private
 * @param {Object|string} options
 * @returns {SimplexOptions}
 *
 * @example
 * parseOptions({});   // => { global: false }
 * parseOptions(null); // => { global: false }
 * parseOptions('g');  // => { global: true }
 */
function parseOptions(options) {
  if (typeof options === 'string') {
    return { global: /g/.test(options) };
  }

  options = (typeof options === 'object' && options) || {};

  return {
    global: !!options.global
  };
}

module.exports = Simplex;
