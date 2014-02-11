/**
 * @private
 * @example
 * createMatcher('name=value'); // => { matcher: /(\w+)=(\w+)/, map: ['name', 'value'] }
 * createMatcher('{ name: value }'); // => { matcher: /\{ (\w+): (\w+) \}/, map: ['name', 'value'] }
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
    matcher: new RegExp(pattern),
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
