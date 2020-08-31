# ra-postgraphile

[![CircleCI](https://circleci.com/gh/BowlingX/ra-postgraphile.svg?style=svg)](https://circleci.com/gh/BowlingX/ra-postgraphile)
[![npm version](https://badge.fury.io/js/ra-postgraphile.svg)](https://badge.fury.io/js/ra-postgraphile)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![codecov](https://codecov.io/gh/BowlingX/ra-postgraphile/branch/master/graph/badge.svg)](https://codecov.io/gh/BowlingX/ra-postgraphile)

Postgraphile client for react-admin

Typescript API: https://bowlingx.github.io/ra-postgraphile/

## Install

    $ yarn add ra-postgraphile / npm install ra-postgraphile --save

## Usage

The `ra-postgraphile` data provider accepts 2 arguments:

- `client` - The `ApolloClient` instance to use.

- `config` - _optional_ configuration

  pgDataProvider(client, [config])

The following examples shows the basic usage:

```js
import React, { useEffect, useState } from 'react'
import { Admin, Resource } from 'react-admin'
import { useApolloClient } from '@apollo/react-hooks'
import pgDataProvider from 'ra-postgraphile'
import { PostList, PostEdit, PostCreate } from './posts'
import { CommentList, CommentEdit, CommentCreate } from './posts'

const App = () => {
  const [dataProvider, setDataProvider] = useState(null)
  const client = useApolloClient()

  useEffect(() => {
    ;(async () => {
      const dataProvider = await pgDataProvider(client)
      setDataProvider(() => dataProvider)
    })()
  }, [])

  return (
    dataProvider && (
      <Admin dataProvider={dataProvider} layout={Layout}>
        <Resource name="Posts" list={PostList} edit={PostEdit} create={PostCreate} />
        <Resource name="Comments" list={CommentList} create={CommentCreate} edit={CommentEdit} />
      </Admin>
    )
  )
}

export default App
```

## Limitations

The project has been tested only with the following plugins enabled on `postgraphile`:
There is limited support for the `postgis` plugin and not all input/query types are properly mapped.

```js
const PgSimplifyInflectorPlugin = require('@graphile-contrib/pg-simplify-inflector')
const PgConnectionFilterPlugin = require('postgraphile-plugin-connection-filter')
```

Please see [src/\_\_test_utils/QueryRunner.ts](src/__test_utils/QueryRunner.ts) for a minimal example setup.

## Configuration

You can pass an _optional_ configuration object:

```ts
const pgDataProviderConfig: ProviderOptions = {
  typeMap: {
    YourType: {
      expand: true,
    },
  },
}
```

- `typeMap` - allows you to configure complex types and how they should be handled.
  Please see ([src/defaultTypeConfig.ts](src/defaultTypeConfig.ts)) for a default mapping.
  Your config will be merged with the defaults.

### TypeConfig options

The following can be configured

| Option                     | Signature                                                                                            | Description                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queryValueToInputValue`   | `(value: any ) => any`                                                                               | Allows you to map the value if used as an input type for mutations. Some values might not convert 1:1 if returned from the query and used as an input |
| `excludeFields`            | `string[] or ((fieldName: string ) => boolean)`                                                      | Allows you to exclude certain fields, either by passing an array (e.g. `['field1', 'field2']`) or a function                                          |
| `includeFields`            | `string[] or ((fieldName: string ) => boolean)`                                                      | Same as exclude fields, but if provided will let you dynamically decide if a field is queried.                                                        |
| `computeArgumentsForField` | `(fieldName: string, args: ReadonlyArray<IntrospectionInputValue> ) => Record< string, any> or null` | Allows you to dynamically provide arguments for a given field                                                                                         |
| `expand`                   | `boolean`                                                                                            | If true, will expand this type and query subfields                                                                                                    |

Please see ([src/types.ts](src/types.ts)) for detailed types of `TypeConfig`.

### Apollo client

Both version `2.x` and `3.x` of apollo client are supported (because you provide the instance).
The current `4.x` version of this library depends on `apollo-client` `2.x`, so
you will get typescript errors. To resolve that you have to cast to `any`:

**Example**:

```ts
// ..
// fix for apollo-client v3
const dataProvider = await createDataProvider(client as any /** other options **/)
// ..
```

Version 5 will depend on `@apollo/client` `3.x`.

## Supported concepts

`ra-postgraphile` works on graphql types that are exposed by `postgraphile`.
We currently support the following constructs to query data:

- `Tables`
- `Views`
- `Functions` with custom return type.

Please see [here](migrations/committed/000001.sql) for an example schema.

### Primary Keys

`react-admin` requires each resource to be identified by a unique `id`. If your resource does not have an `id` field,
we will use the generated `nodeId` from your `primaryKey`. All types processed by `ra-postgraphile` require a primary key.

## Contribution

- Contribution is very welcome :).
- Please create your commit messages based on [semantic-release syntax](https://github.com/semantic-release/semantic-release#how-does-it-work) and semantics (e.g. properly mark Breaking changes etc.).
  This let's us automatically create release notes and releases to NPM.

## Development

We are using `yarn` for package management.

To run all tests you have to start the dependent postgres container with `docker-compose up -d`.
