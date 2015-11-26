/* global it, beforeEach */

'use strict'

var assert = require('assert')
var formatter = require('../')
var _ = require('lodash')

var options

function format (src) {
  return formatter(src, options)
}

beforeEach(function () {
  options = {maxLineLength: 5}
})

it('should add a line break because max line length is exceeded', function () {
  assert.equal(format('1 + 2 + 3').toString(), '1 + 2\n+ 3')
})

it('should not leave WhiteSpace at the end of a line when inserting a line break', function () {
  assert.equal(format('1 +2 + 3').toString(), '1 +2\n+ 3')
})

it('should keep indentation', function () {
  assert.equal(format('  1 + 2').toString(), '  1 +\n  2')
})

it('should indent a new line break when indentBy is set', function () {
  options.indentBy = 2
  assert.equal(format('  1 + 2').toString(), '  1 +\n    2')
})

it('should keep indentation when adding serveral line breaks', function () {
  assert.equal(format('  1 + 2 + 3').toString(),
    '  1 +\n  2 +\n  3')
})

it('should not add line a break in front of a line break', function () {
  assert.equal(format('  1 +\n  2 +\n  3').toString(),
    '  1 +\n  2 +\n  3')
})

it('should not add a line break after postfix increment', function () {
  assert.equal(format('    i++').toString(),
    '    i++')
})

it('should not add a line break after postfix decrement', function () {
  assert.equal(format('    i--').toString(),
    '    i--')
})

it('should add line break after return if followed by statement ender', function () {
  assert.equal(format('function foo () {\nreturn}').toString()
    .match(/return[\s]*/)[0], 'return\n')
})
it('should not add line break after return if not followed by statement ender', function () {
  assert.equal(format('function foo () {\nreturn 3}').toString()
    .match(/return[\s]*./)[0], 'return 3')
})

it('should add line break after break if followed by statement ender', function () {
  assert.equal(format('while(true) {\n   break}').toString()
    .match(/break[\n]+/)[0], 'break\n')
})
it('should not add line break after break if not followed by statement ender', function () {
  assert.equal(format('menot: while(true) {\nbreak menot }').toString()
    .match(/break[\s]+menot/)[0], 'break menot')
})

it('should add line break after continue if followed by statement ender', function () {
  assert.equal(format('while(true) {\n   continue}').toString()
    .match(/continue[\n]+/)[0], 'continue\n')
})
it('should not add line break after continue if not followed by statement ender', function () {
  assert.equal(format('menot: while(true) {\ncontinue menot }').toString()
    .match(/continue[\s]+menot/)[0], 'continue menot')
})

it('should not add a line break after an existing line break', function () {
  assert.equal(format('11111\n222222').toString(), '11111\n222222')
})

it('should split strings and keep double quotes', function () {
  options.splitStrings = true
  assert.equal(format('"12345"').toString(), '"123"\n+ "4"\n+ "5"')
})

it('should split strings and keep single quotes', function () {
  options.splitStrings = true
  assert.equal(format("'12345'").toString(), "'123'\n+ '4'\n+ '5'")
})

it('should split strings and keep indentation', function () {
  options.splitStrings = true
  assert.equal(format('  "12345"').toString(), '  "1"\n  + "2"\n  + "3"\n  + "4"\n  + "5"')
})

it('should split string at edge of maxLineLength', function () {
  options.splitStrings = true
  assert.equal(format(";;;'12345'").toString(), ";;;\n'1'\n+ '2'\n+ '3'\n+ '4'\n+ '5'")
})
