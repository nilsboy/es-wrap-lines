// See: http://inimino.org/~inimino/blog/javascript_semicolons

'use strict'
// console.error = function (x) {}

var _ = require('lodash')
var parser = require('rocambole')
var tokenHelper = require('rocambole-token')

var defaultOptions = {
  maxLineLength: 80,
  indentBy: 0,
  splitStrings: false
}

var ONLY_BREAK_WITH_ENDER = [ 'break', 'continue', 'return', 'throw' ]
var POSTFIX_NO_BREAK = [ '++', '--' ]

module.exports = format

function format (src, options) {
  var ast = parser.parse(src)

  options = _.extend({}, defaultOptions, options)

  var pos = 0
  ast.tokens.forEach(function (token) {
    var prev = _findPrevNonWhiteSpace(token)
    var next = _findNextNonWhiteSpace(token)

    pos += token.range[1] - token.range[0]

    if (token.type === 'LineBreak') {
      pos = 0
      return
    }

    if (pos <= options.maxLineLength) {
      return
    }

    if (token.type === 'WhiteSpace') return
    if (token.next && token.next.type === 'LineBreak') return
    if (token.prev && token.prev.type === 'LineBreak') return

    if (prev.type === 'Keyword') {
      if (_.contains(ONLY_BREAK_WITH_ENDER, prev.value)) {
        if (!isStatementEnder(token)) {
          return
        }
      }
    }

    if (token.type === 'Identifier') {
      if (isPunctuatorPostFix(next)) return
    }

    if (isPunctuatorPostFix(token)) {
      if (prev.type === 'Identifier') return
    }

    var indentation = _findIndentation(token)

    if (token.type === 'String') {
      if (token.value.length > options.maxLineLength) {
        splitString(token, options.maxLineLength, indentation, options.indentBy, pos)
        return
      }
    }

    if (token.prev && token.prev.type === 'WhiteSpace') {
      token.prev.value = ''
    }

    var lineBreak = tokenHelper.after(prev, { type: 'LineBreak', value: '\n'})
    insertIndentationAfter(lineBreak, indentation, options.indentBy)

    pos = token.range[1] - token.range[0]
    if (indentation && indentation.range) {
      pos += indentation.range[1] - indentation.range[0]
    }
  })

  // console.error('\nresult:', '\n' , ast.toString())

  return ast
}

function splitString (token, maxLineLength, indentation, indentBy, pos) {
  var maxStringLength = maxLineLength - 4
  var stringValue = token.value.substring(1, token.value.length - 1)
  var splitRegex = new RegExp('.{1,' + maxStringLength + '}', 'g')
  var quote = token.value.substring(0, 1)

  var firstStringLength = maxLineLength - (pos - (token.range[1] - token.range[0])) - 2
  var onlyIndentationPreceeding = pos - token.value.length === indentation.value.length

  var noFirstString = false
  if (firstStringLength < maxLineLength || onlyIndentationPreceeding) {
    // is non-empty string
    if (firstStringLength > 0) {
      if (firstStringLength < 0) firstStringLength = maxLineLength - 2
      var splitRegexFirst = new RegExp('^(.{1,' + firstStringLength + '})(.*)', 'g')

      var stringValues = splitRegexFirst.exec(stringValue)
      var firstString = stringValues[1]
      stringValue = stringValues[2]

      token.value = quote + firstString + quote
    } else {
      // TODO remove token instead?
      token.value = ''
      noFirstString = true
    }
  }

  var currentToken = token
  stringValue
    .match(splitRegex)
    .forEach(function (chunk) {
      currentToken = addStringChunk(quote + chunk + quote, currentToken, indentation, indentBy, noFirstString)
      noFirstString = false
    })
}

function addStringChunk (chunk, token, indentation, indentBy, isFirst) {
  token = tokenHelper.after(token, { type: 'LineBreak', value: '\n' })
  token = insertIndentationAfter(token, indentation, indentBy)
  if (!isFirst) {
    token = tokenHelper.after(token, { type: 'Punctuator', value: '+' })
    token = tokenHelper.after(token, { type: 'WhiteSpace', value: ' '})
  }
  token = tokenHelper.after(token, { type: 'String', value: chunk })
  return token
}

function isStatementEnder (token) {
  if (token.type === 'LineBreak') return true
  if (token.type === 'Punctuator' && token.value === ';') return true
  if (token.type === 'Punctuator' && token.value === '}') return true
  return false
}

function isPunctuatorPostFix (token) {
  if (!token) return false
  if (token.type !== 'Punctuator') return false
  if (! _.contains(POSTFIX_NO_BREAK, token.value)) return false
  return true
}

function insertIndentationAfter (token, indentation, indentBy) {
  if (! indentation) return token

  var indentationValue = indentation.value + _.repeat(' ', indentBy)

  var newIndentation
  if (token.next && token.next.type === 'WhiteSpace') {
    newIndentation = token.next
    _.extend(newIndentation.range, indentation.range)
    newIndentation.value = indentationValue
    return newIndentation
  } else {
    return tokenHelper.after(token, { type: indentation.type, value: indentationValue
    })
  }
}

function _findNextNonWhiteSpace (token) {
  while (token.next) {
    token = token.next
    if (token.type !== 'WhiteSpace') return token
  }

  return {type: 'Empty'}
}

function _findPrevNonWhiteSpace (token) {
  while (token.prev) {
    token = token.prev
    if (token.type !== 'WhiteSpace') return token
  }
  return {type: 'Empty'}
}

function _findIndentation (token) {
  var indentation = { type: 'WhiteSpace', value: '' }
  while (token.prev) {
    token = token.prev
    if (token.type === 'WhiteSpace') {
      indentation = token
      continue
    }
    if (token.type === 'LineBreak') {
      return indentation
    }
    indentation = { type: 'WhiteSpace', value: '' }
  }

  return indentation
}

