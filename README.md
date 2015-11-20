# es-wrap-lines [![Build Status](https://travis-ci.org/nilsboy/es-wrap-lines.svg?branch=master)](https://travis-ci.org/nilsboy/es-wrap-lines)

> Strip unnecessary semicolons from Ecmascript code.

## Installation

```sh
    npm install es-wrap-lines
```

## CLI

```sh
Usage,
  $ es-wrap-lines <input file> > <output file>,
  $ cat <input file> | es-wrap-lines > <output file>,
,
Examples,
  $ es-wrap-lines src/app.js > dist/app.js,
  $ cat src/app.js | es-wrap-lines > dist/app.js
```

## Use with [esformatter](https://github.com/millermedeiros/esformatter)

```json
{
   "plugins" : [
   ],
   "pipe" : {
      "after" : [
         "es-wrap-lines"
      ]
   }
}

```

## License

ISC © [Nils Boysen]
