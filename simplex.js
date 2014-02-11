/**
 * Simplex: Simpler than regular expressions
 */

(function() {

  /**
   * @typedef {Object} SimplexOptions
   * @property {FieldMarkers} fieldMarkers
   */
  var SimplexOptions;

  /**
   * @typedef {Object} FieldMarkers
   * @property {string} left
   * @property {string} right
   */
  var FieldMarkers;

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
   * @param {SimplexOptions} options
   */
  function Simplex(expression, options) {
    if (!(this instanceof Simplex)) {
      return new Simplex(expression, options);
    }

    this.options = (typeof options === 'object' && options) || {};
    this.matcher = createMatcher(expression, this.options);
  }

  Simplex.prototype = {
    /**
     * Parses the given text to an object whose keys are the names of the
     * word-like tokens in the source expression for this {@link Simplex}, and
     * whose associated values are the matches for those tokens.
     *
     * A very basic attempt will be made to infer the types of the matched values;
     * i.e, values that appear to be numbers or booleans will be parsed as such.
     * All other values will simply be strings.
     *
     * @param {string} text
     * @returns {Object}
     *
     * @example
     * Simplex('a=b(c) d/e').match('foo=bar(baz) yes/no');
     * // => {
     *   a: 'foo',
     *   b: 'bar',
     *   c: 'baz',
     *   d: 'yes',
     *   e: 'no'
     * }
     *
     * Simplex('(x, y)').match('(1, 3)');
     * // => { x: 1, y: 3 }
     *
     * Simplex('<tags*>').match('blah <foo bar> blah');
     * // => { tags: 'foo bar' }
     *
     * Simplex('[exclamation*]!', { fieldMarkers: '[]' })
     *   .match('Hello there, Dan!');
     * // => { exclamation: 'Hello there, Dan'}
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

    /**
     * Behaves like {@link #match}, but returns an array with *all* matches from
     * the given string.
     *
     * @param {string} text
     * @returns {Object}
     *
     * @example
     * Simplex('pairName=[x,y]').matchAll('foo=[a,b]&bar=[c,d]');
     * // => [
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
      data[map[i]] = weakParse(match[i + 1]);
    }
    return data;
  }

  /**
   * @private
   * @param {string} string
   * @returns {number|boolean|string}
   *
   * weakParse('123');  // => 123
   * weakParse('true'); // => true
   * weakParse('foo');  // => 'foo'
   * weakParse('123a'); // => '123a'
   * weakParse('tru');  // => 'tru'
   */
  function weakParse(string) {
    if (/^\d+$/.test(string)) {
      return Number(string);
    } else if (/^(?:true|false)$/.test(string)) {
      return Boolean(string);
    }

    return string;
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
   * createMatcher('[name] foo [value]', { fieldMarkers: '[]' });
   * // => {
   *   pattern: /(\w+) foo (\w+)/,
   *   map: ['name', 'value']
   * }
   */
  function createMatcher(expression, options) {
    var fieldMarkers = parseFieldMarkers(options.fieldMarkers),
        tokenMatcher = getTokenMatcher(fieldMarkers),
        tokenMatch,
        pattern = '',
        index = 0,
        map = [];

    while (tokenMatch = tokenMatcher.exec(expression)) {
      pattern += escapeRegex(expression.substring(index, tokenMatch.index));

      if (isMultiwordToken(tokenMatch[0], fieldMarkers)) {
        pattern += '(.*)';
      } else {
        pattern += '(\\w+)';
      }

      index = tokenMatch.index + tokenMatch[0].length;

      map.push(tokenMatch[1]);
    }

    if (index < expression.length) {
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
   * @return {FieldMarkers|null}
   *
   * @example
   * parseFieldMarkers(null);                     // => null
   * parseFieldMarkers('[]');                     // => { left: '[', right: ']' }
   * parseFieldMarkers('{{}}');                   // => { left: '{{', right: '}}' }
   * parseFieldMarkers(['a', 'b']);               // => { left: 'a', right: 'b' }
   * parseFieldMarkers({ left: '*', right: '!'}); // => { left: '*', right: '!'}
   */
  function parseFieldMarkers(input) {
    if (!input) {
      return null;
    }

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

    return {
      left: input.left || '',
      right: input.right || ''
    };
  }

  /**
   * @private
   * @param {FieldMarkers} fieldMarkers
   * @returns {RegExp}
   *
   * @example
   * getTokenMatcher(parseFieldMarkers('{}')); // => /\{(\w+)\*?\}/g
   * getTokenMatcher({}); // => /(\w+)\*?/g
   */
  function getTokenMatcher(fieldMarkers) {
    if (!fieldMarkers) {
      return /(\w+)\*?/g;
    }

    var left  = fieldMarkers.left,
        right = fieldMarkers.right;

    return new RegExp(escapeRegex(left) + '(\\w+)\\*?' + escapeRegex(right), 'g');
  }

  /**
   * @private
   * @param {string} match
   * @param {FieldMarkers?} fieldMarkers
   * @return {boolean}
   */
  function isMultiwordToken(match, fieldMarkers) {
    if (fieldMarkers && fieldMarkers.right) {
      return new RegExp('\\*' + escapeRegex(fieldMarkers.right)).test(match);
    }

    return /\*$/.test(match);
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

  // Expose in Node.js
  if (typeof module === 'object' && module && module.exports) {
    module.exports = Simplex;

  // Or in a browser window/web worker
  } else {
    this.Simplex = Simplex;
  }

}).call(this);
