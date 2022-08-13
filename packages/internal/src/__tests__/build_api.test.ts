import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import compat from 'core-js-compat'

import { cleanApiBuild, prebuildApiFiles } from '../build/api'
import {
  getApiSideBabelConfigPath,
  getApiSideBabelPlugins,
  getApiSideDefaultBabelConfig,
} from '../build/babel/api'
import { findApiFiles } from '../files'
import { ensurePosixPath, getPaths } from '../paths'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

// Fixtures, filled in beforeAll
let prebuiltFiles
let relativePaths

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
  cleanApiBuild()

  const apiFiles = findApiFiles()
  prebuiltFiles = prebuildApiFiles(apiFiles)

  relativePaths = prebuiltFiles
    .filter((x) => typeof x !== 'undefined')
    .map(cleanPaths)
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', () => {
  // Builds non-nested functions
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/functions/graphql.js'
  )

  // Builds graphql folder
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/graphql/todos.sdl.js'
  )

  // Builds nested function
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/functions/nested/nested.js'
  )
})

test('api prebuild finds babel.config.js', () => {
  let p = getApiSideBabelConfigPath()
  p = cleanPaths(p)
  expect(p).toEqual('api/babel.config.js')
})

test('api prebuild uses babel config only from the api side root', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('dog.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')
  expect(code).toContain(`import dog from "dog-bless";`)

  // Should ignore root babel config
  expect(code).not.toContain(`import kitty from "kitty-purr"`)
})

// Still a bit of a mystery why this plugin isn't transforming gql tags
test.skip('api prebuild transforms gql with `babel-plugin-graphql-tag`', () => {
  // babel-plugin-graphql-tag should transpile the "gql" parts of our files,
  // achieving the following:
  // 1. removing the `graphql-tag` import
  // 2. convert the gql syntax into graphql's ast.
  //
  // https://www.npmjs.com/package/babel-plugin-graphql-tag
  const builtFiles = prebuildApiFiles(findApiFiles())
  const p = builtFiles
    .filter((x) => typeof x !== 'undefined')
    .filter((p) => p.endsWith('todos.sdl.js'))
    .pop()

  const code = fs.readFileSync(p, 'utf-8')
  expect(code.includes('import gql from "graphql-tag";')).toEqual(false)
  expect(code.includes('gql`')).toEqual(false)
})

test('Pretranspile polyfills unsupported functionality', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('polyfill.js')).pop()

  const code = fs.readFileSync(p, 'utf-8')

  expect(code).toContain(
    `import _AggregateError from "core-js-pure/features/aggregate-error.js";`
  )

  expect(code).toContain(
    `import _compositeKey from "core-js-pure/features/composite-key.js"`
  )
  expect(code).toContain(
    `import _compositeSymbol from "core-js-pure/features/composite-symbol.js";`
  )

  expect(code).toContain(
    `import _Map from "core-js-pure/features/map/index.js"`
  )
  const _Map = require('@babel/runtime-corejs3/core-js/map')
  expect(_Map).toHaveProperty('deleteAll')
  expect(_Map).toHaveProperty('every')
  expect(_Map).toHaveProperty('filter')
  expect(_Map).toHaveProperty('find')
  expect(_Map).toHaveProperty('findKey')
  expect(_Map).toHaveProperty('from')
  expect(_Map).toHaveProperty('groupBy')
  expect(_Map).toHaveProperty('includes')
  expect(_Map).toHaveProperty('keyBy')
  expect(_Map).toHaveProperty('keyOf')
  expect(_Map).toHaveProperty('mapKeys')
  expect(_Map).toHaveProperty('mapValues')
  expect(_Map).toHaveProperty('merge')
  expect(_Map).toHaveProperty('of')
  expect(_Map).toHaveProperty('reduce')
  expect(_Map).toHaveProperty('some')
  expect(_Map).toHaveProperty('update')

  expect(code).toContain(
    `import _Math$clamp from "core-js-pure/features/math/clamp.js"`
  )
  expect(code).toContain(
    `import _Math$DEG_PER_RAD from "core-js-pure/features/math/deg-per-rad.js"`
  )

  expect(code).toContain(
    `import _Math$degrees from "core-js-pure/features/math/degrees.js"`
  )
  expect(code).toContain(
    `import _Math$fscale from "core-js-pure/features/math/fscale.js"`
  )
  expect(code).toContain(
    `import _Math$RAD_PER_DEG from "core-js-pure/features/math/rad-per-deg.js"`
  )
  expect(code).toContain(
    `import _Math$radians from "core-js-pure/features/math/radians.js"`
  )
  expect(code).toContain(
    `import _Math$scale from "core-js-pure/features/math/scale.js"`
  )
  expect(code).toContain(
    `import _Math$seededPRNG from "core-js-pure/features/math/seeded-prng.js"`
  )
  expect(code).toContain(
    `import _Math$signbit from "core-js-pure/features/math/signbit.js"`
  )
  expect(code).toContain(
    `import _Math$iaddh from "core-js-pure/features/math/iaddh.js"`
  )
  expect(code).toContain(
    `import _Math$imulh from "core-js-pure/features/math/imulh.js"`
  )
  expect(code).toContain(
    `import _Math$isubh from "core-js-pure/features/math/isubh.js"`
  )
  expect(code).toContain(
    `import _Math$umulh from "core-js-pure/features/math/umulh.js"`
  )

  expect(code).toContain(
    `import _Number$fromString from "core-js-pure/features/number/from-string.js"`
  )

  expect(code).toContain(
    `import _Observable from "core-js-pure/features/observable/index.js"`
  )
  expect(code).toContain(
    `import _Symbol$observable from "core-js-pure/features/symbol/observable.js"`
  )

  expect(code).toContain(
    `import _Promise from "core-js-pure/features/promise/index.js"`
  )
  const _Promise = require('core-js-pure/features/promise/index.js')
  expect(_Promise).toHaveProperty('any')
  expect(_Promise).toHaveProperty('try')

  expect(code).toContain(
    `import _Reflect$defineMetadata from "core-js-pure/features/reflect/define-metadata.js"`
  )
  expect(code).toContain(
    `import _Reflect$getOwnMetadataKeys from "core-js-pure/features/reflect/get-own-metadata-keys.js"`
  )
  expect(code).toContain(
    `import _Reflect$getOwnMetadata from "core-js-pure/features/reflect/get-own-metadata.js"`
  )

  expect(code).toContain(
    `import _Set from "core-js-pure/features/set/index.js"`
  )
  const _Set = require('@babel/runtime-corejs3/core-js/set')
  expect(_Set).toHaveProperty('addAll')
  expect(_Set).toHaveProperty('deleteAll')
  expect(_Set).toHaveProperty('difference')
  expect(_Set).toHaveProperty('every')
  expect(_Set).toHaveProperty('filter')
  expect(_Set).toHaveProperty('find')
  expect(_Set).toHaveProperty('from')
  expect(_Set).toHaveProperty('intersection')
  expect(_Set).toHaveProperty('isDisjointFrom')
  expect(_Set).toHaveProperty('isSubsetOf')
  expect(_Set).toHaveProperty('isSupersetOf')
  expect(_Set).toHaveProperty('join')
  expect(_Set).toHaveProperty('map')
  expect(_Set).toHaveProperty('of')
  expect(_Set).toHaveProperty('reduce')
  expect(_Set).toHaveProperty('some')
  expect(_Set).toHaveProperty('symmetricDifference')
  expect(_Set).toHaveProperty('union')

  expect(code).toContain(
    `import _codePointsInstanceProperty from "core-js-pure/features/instance/code-points.js"`
  )
  expect(code).toContain(
    `import _replaceAllInstanceProperty from "core-js-pure/features/instance/replace-all.js"`
  )
  expect(code).toContain(
    `import _atInstanceProperty from "core-js-pure/features/instance/at.js"`
  )
  expect(code).toContain(
    `import _Symbol$patternMatch from "core-js-pure/features/symbol/pattern-match.js"`
  )
  expect(code).toContain(
    `import _Symbol$dispose from "core-js-pure/features/symbol/dispose.js"`
  )

  expect(code).toContain(
    `import _WeakMap from "core-js-pure/features/weak-map/index.js"`
  )
  const _WeakMap = require('@babel/runtime-corejs3/core-js/weak-map')
  expect(_WeakMap).toHaveProperty('deleteAll')
  expect(_WeakMap).toHaveProperty('from')
  expect(_WeakMap).toHaveProperty('of')

  expect(code).toContain(
    `import _WeakSet from "core-js-pure/features/weak-set/index.js"`
  )
  const _WeakSet = require('@babel/runtime-corejs3/core-js/weak-set')
  expect(_WeakSet).toHaveProperty('addAll')
  expect(_WeakSet).toHaveProperty('deleteAll')
  expect(_WeakSet).toHaveProperty('from')
  expect(_WeakSet).toHaveProperty('of')

  // Expect these to remain unchanged.
  expect(code).toContain(
    [
      `const buffer = new ArrayBuffer(8);`,
      `const uint8 = new Uint8Array(buffer);`,
      `uint8.set([1, 2, 3], 3);`,
    ].join('\n')
  )

  expect(code).toContain(
    [
      `[1, 2, 3].lastItem;`,
      `[1, 2, 3].lastIndex;`,
      `const array = [1, 2, 3];`,
      `array.lastItem = 4;`,
      `new Array(1, 2, 3).lastItem;`,
      `new Array(1, 2, 3).lastIndex;`,
    ].join('\n')
  )
})

test.skip('Pretranspile uses corejs3 aliasing', () => {
  // See https://babeljs.io/docs/en/babel-plugin-transform-runtime#core-js-aliasing
  // This is because we configure the transform runtime plugin corejs

  const p = prebuiltFiles.filter((p) => p.endsWith('transform.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')

  // Polyfill for Symbol
  expect(code).toContain(
    `import _Symbol from "@babel/runtime-corejs3/core-js/symbol"`
  )

  // Polyfill for Promise
  expect(code).toContain(
    `import _Promise from "@babel/runtime-corejs3/core-js/promise"`
  )

  // Polyfill for .includes
  expect(code).toContain(
    'import _includesInstanceProperty from "@babel/runtime-corejs3/core-js/instance/includes"'
  )

  // Polyfill for .iterator
  expect(code).toContain(
    `import _getIterator from "@babel/runtime-corejs3/core-js/get-iterator"`
  )
})

test('jest mock statements also handle', () => {
  const pathToTest = path.join(getPaths().api.services, 'todos/todos.test.js')

  const code = fs.readFileSync(pathToTest, 'utf-8')

  const defaultOptions = getApiSideDefaultBabelConfig()

  // Step 1: prebuild service/todos.test.js
  const outputForJest = babel.transform(code, {
    ...defaultOptions,
    filename: pathToTest,
    cwd: getPaths().api.base,
    // We override the plugins, to match packages/testing/config/jest/api/index.js
    plugins: getApiSideBabelPlugins({ forJest: true }),
  }).code

  // Step 2: check that output has correct import statement path
  expect(outputForJest).toContain('import dog from "../../lib/dog"')
  // Step 3: check that output has correct jest.mock path
  expect(outputForJest).toContain('jest.mock("../../lib/dog"')
})

test('core-js polyfill list', () => {
  const { list } = compat({
    targets: { node: '14.20' },
    version: '3.24',
  })

  expect(list).toMatchInlineSnapshot(`
    Array [
      "es.error.cause",
      "es.aggregate-error",
      "es.aggregate-error.cause",
      "es.array.at",
      "es.array.find-last",
      "es.array.find-last-index",
      "es.array.push",
      "es.object.has-own",
      "es.promise.any",
      "es.reflect.to-string-tag",
      "es.regexp.flags",
      "es.string.at-alternative",
      "es.string.replace-all",
      "es.typed-array.at",
      "es.typed-array.find-last",
      "es.typed-array.find-last-index",
      "es.typed-array.set",
      "esnext.array.from-async",
      "esnext.array.filter-out",
      "esnext.array.filter-reject",
      "esnext.array.group",
      "esnext.array.group-by",
      "esnext.array.group-by-to-map",
      "esnext.array.group-to-map",
      "esnext.array.is-template-object",
      "esnext.array.last-index",
      "esnext.array.last-item",
      "esnext.array.to-reversed",
      "esnext.array.to-sorted",
      "esnext.array.to-spliced",
      "esnext.array.unique-by",
      "esnext.array.with",
      "esnext.async-iterator.constructor",
      "esnext.async-iterator.as-indexed-pairs",
      "esnext.async-iterator.drop",
      "esnext.async-iterator.every",
      "esnext.async-iterator.filter",
      "esnext.async-iterator.find",
      "esnext.async-iterator.flat-map",
      "esnext.async-iterator.for-each",
      "esnext.async-iterator.from",
      "esnext.async-iterator.indexed",
      "esnext.async-iterator.map",
      "esnext.async-iterator.reduce",
      "esnext.async-iterator.some",
      "esnext.async-iterator.take",
      "esnext.async-iterator.to-array",
      "esnext.bigint.range",
      "esnext.composite-key",
      "esnext.composite-symbol",
      "esnext.function.is-callable",
      "esnext.function.is-constructor",
      "esnext.function.un-this",
      "esnext.iterator.constructor",
      "esnext.iterator.as-indexed-pairs",
      "esnext.iterator.drop",
      "esnext.iterator.every",
      "esnext.iterator.filter",
      "esnext.iterator.find",
      "esnext.iterator.flat-map",
      "esnext.iterator.for-each",
      "esnext.iterator.from",
      "esnext.iterator.indexed",
      "esnext.iterator.map",
      "esnext.iterator.reduce",
      "esnext.iterator.some",
      "esnext.iterator.take",
      "esnext.iterator.to-array",
      "esnext.iterator.to-async",
      "esnext.map.delete-all",
      "esnext.map.emplace",
      "esnext.map.every",
      "esnext.map.filter",
      "esnext.map.find",
      "esnext.map.find-key",
      "esnext.map.from",
      "esnext.map.group-by",
      "esnext.map.includes",
      "esnext.map.key-by",
      "esnext.map.key-of",
      "esnext.map.map-keys",
      "esnext.map.map-values",
      "esnext.map.merge",
      "esnext.map.of",
      "esnext.map.reduce",
      "esnext.map.some",
      "esnext.map.update",
      "esnext.map.update-or-insert",
      "esnext.map.upsert",
      "esnext.math.clamp",
      "esnext.math.deg-per-rad",
      "esnext.math.degrees",
      "esnext.math.fscale",
      "esnext.math.iaddh",
      "esnext.math.imulh",
      "esnext.math.isubh",
      "esnext.math.rad-per-deg",
      "esnext.math.radians",
      "esnext.math.scale",
      "esnext.math.seeded-prng",
      "esnext.math.signbit",
      "esnext.math.umulh",
      "esnext.number.from-string",
      "esnext.number.range",
      "esnext.object.iterate-entries",
      "esnext.object.iterate-keys",
      "esnext.object.iterate-values",
      "esnext.observable",
      "esnext.promise.try",
      "esnext.reflect.define-metadata",
      "esnext.reflect.delete-metadata",
      "esnext.reflect.get-metadata",
      "esnext.reflect.get-metadata-keys",
      "esnext.reflect.get-own-metadata",
      "esnext.reflect.get-own-metadata-keys",
      "esnext.reflect.has-metadata",
      "esnext.reflect.has-own-metadata",
      "esnext.reflect.metadata",
      "esnext.set.add-all",
      "esnext.set.delete-all",
      "esnext.set.difference",
      "esnext.set.every",
      "esnext.set.filter",
      "esnext.set.find",
      "esnext.set.from",
      "esnext.set.intersection",
      "esnext.set.is-disjoint-from",
      "esnext.set.is-subset-of",
      "esnext.set.is-superset-of",
      "esnext.set.join",
      "esnext.set.map",
      "esnext.set.of",
      "esnext.set.reduce",
      "esnext.set.some",
      "esnext.set.symmetric-difference",
      "esnext.set.union",
      "esnext.string.at",
      "esnext.string.cooked",
      "esnext.string.code-points",
      "esnext.symbol.async-dispose",
      "esnext.symbol.dispose",
      "esnext.symbol.matcher",
      "esnext.symbol.metadata",
      "esnext.symbol.metadata-key",
      "esnext.symbol.observable",
      "esnext.symbol.pattern-match",
      "esnext.symbol.replace-all",
      "esnext.typed-array.from-async",
      "esnext.typed-array.filter-out",
      "esnext.typed-array.filter-reject",
      "esnext.typed-array.group-by",
      "esnext.typed-array.to-reversed",
      "esnext.typed-array.to-sorted",
      "esnext.typed-array.to-spliced",
      "esnext.typed-array.unique-by",
      "esnext.typed-array.with",
      "esnext.weak-map.delete-all",
      "esnext.weak-map.from",
      "esnext.weak-map.of",
      "esnext.weak-map.emplace",
      "esnext.weak-map.upsert",
      "esnext.weak-set.add-all",
      "esnext.weak-set.delete-all",
      "esnext.weak-set.from",
      "esnext.weak-set.of",
      "web.atob",
      "web.btoa",
      "web.dom-exception.constructor",
      "web.dom-exception.stack",
      "web.dom-exception.to-string-tag",
      "web.structured-clone",
    ]
  `)
})
