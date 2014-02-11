/**
 * A simple expression.
 *
 * @constructor
 * @param {string} expression
 * @param {Object} options
 */
function Simplex(expression, options) {
  if (!(this instanceof Simplex)) {
    return new Simplex(expression, options);
  }

  this.matcher = createMatcher(expression);
  this.options = parseOptions(options || {});
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
 * @example
 * createMatcher('name=value'); // => { pattern: /(\w+)=(\w+)/, map: ['name', 'value'] }
 * createMatcher('{ name: value }'); // => { pattern: /\{ (\w+): (\w+) \}/, map: ['name', 'value'] }
 */
function createMatcher(expression) {
  var tokenMatcher = /\w+/g,
      tokenMatch,
      pattern = '',
      index = 0,
      map = [];

  while (tokenMatch = tokenMatcher.exec(expression)) {
    pattern += escapeRegex(expression.substring(index, tokenMatch.index)) + '(\\w+)';
    index = tokenMatch.index + tokenMatch[0].length;
    map.push(tokenMatch[0]);
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
 * @example
 * escapeRegex('^hi$'); // => '\\^hi\\$'
 */
function escapeRegex(source) {
  return source.replace(/([\(\)\[\]\{\}\^\$])/g, '\\$1');
}

/**
 * @private
 * @example
 * parseOptions({});   // => {}
 * parseOptions(null); // => {}
 * parseOptions('g');  // => { global: true }
 */
function parseOptions(options) {
  switch (typeof options) {
    case 'object':
      return options || {};

    case 'string':
      return { global: /g/.test(options) };

    default:
      return {};
  }
}

module.exports = Simplex;
