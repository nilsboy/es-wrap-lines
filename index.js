 // See: http://inimino.org/~inimino/blog/javascript_semicolons

'use strict'
// TODO console.error = function (x) {}

var _ = require('lodash')
var parser = require('rocambole')
var tokenHelper = require('rocambole-token')

var defaultOptions = {
  maxLineLength: 80,
  indentBy: 0
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

    // console.error(token.value, ' (' , token.type, ' / prev: ', prev.type, ' / next: ', next.type, ')')

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

    // console.error('adding new line:', token.  value, 'lb after: ', prev.type)

    var lineBreak = {
      type: 'LineBreak',
      value: '\n'
    }

    if (token.prev && token.prev.type === 'WhiteSpace') {
      token.prev.value = ''
    }

    var indentation = _findIndentation(token)

    tokenHelper.after(prev, lineBreak)
    insertIndentationAfter(lineBreak, indentation, options.indentBy)

    pos = token.range[1] - token.range[0]
    if (indentation && indentation.range) {
      pos += indentation.range[1] - indentation.range[0]
    }
  })

  // console.error('\nresult:', '\n' , ast.toString())

  return ast
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
  if (! indentation) return

  var indentationValue = indentation.value + _.repeat(' ', indentBy)

  var newIndentation
  if (token.next && token.next.type === 'WhiteSpace') {
    newIndentation = token.next
    _.extend(newIndentation.range, indentation.range)
    newIndentation.value = indentationValue
  } else {
    tokenHelper.after(token, { type: indentation.type, value: indentationValue
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
  var indentation
  while (token.prev) {
    token = token.prev
    if (token.type === 'WhiteSpace') {
      indentation = token
      continue
    }
    if (token.type === 'LineBreak') {
      return indentation
    }
    indentation = undefined
  }

  return indentation
}
