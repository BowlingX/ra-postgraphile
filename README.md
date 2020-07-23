# ra-postgraphile

[![CircleCI](https://circleci.com/gh/BowlingX/ra-postgraphile.svg?style=svg)](https://circleci.com/gh/BowlingX/ra-postgraphile)
[![npm version](https://badge.fury.io/js/ra-postgraphile.svg)](https://badge.fury.io/js/ra-postgraphile)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

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

Please see `src\__test_utils\QueryRunner.ts` for a minimal example setup.

## Configuration

You can pass an _optional_ configuration object:

```js
const pgDataProviderConfig = {
  queryValueToInputValueMap: {
    GeographyPoint: (value) => value.geojson,
  },
}
```

- `queryValueToInputValueMap` - allows you to specify a mapping of how a type should map if it's taken as an Input.
  Please see ([src/defaultValueInputTypeMapping](src/defaultValueInputTypeMapping.ts)) for a default mapping.
  Your config will be merged with the defaults.

  The Map is also used to specify what complex types should be completely queried.
  By default only `scalar` and `scalar[]` fields are fetched.

## Supported concepts

`ra-postgraphile` works on graphql types that are exposed by `postgraphile`.
We currently support the following constructs to query data:

- `Tables`
- `Views`
- `Functions` with custom return type.

Please see [here](migrations/committed/000001.sql) for an example schema.

### Primary Keys

`react-admin` requires each resource to be identified by a unique `id`. If your resource does not have an `id` field,
we will use the generated `nodeId` from your `primaryKey`.

## Contribution

- Contribution is very welcome :).
- Please create your commit messages based on [semantic-release syntax](https://github.com/semantic-release/semantic-release#how-does-it-work) and semantics (e.g. properly mark Breaking changes etc.).
  This let's us automatically create release notes and releases to NPM.

## Development

We are using `yarn` for package management.

To run all tests you have to start the dependent postgres container with `docker-compose up -d`.
