#!/usr/bin/env node

'use strict'

var fs = require('fs')
var stdin = require('get-stdin')
var meow = require('meow')
var formatter = require('..')

var cli = meow([
  'Usage',
  '  $ es-wrap-lines <input file> > <output file>',
  '  $ cat <input file> | es-wrap-lines > <output file>',
  '',
  'Examples',
  '  $ es-wrap-lines src/app.js > dist/app.js',
  '  $ cat src/app.js | es-wrap-lines > dist/app.js'
])

if(cli.input[0]) {
  process.stdout.write(formatter(fs.readFileSync(cli.input[0], 'utf8')).toString())
  process.exit(0)
}

if (process.stdin.isTTY) {
    console.error('Input file required')
    process.exit(1)
}

stdin(function (data) {
  process.stdout.write(formatter(data).toString())
})
