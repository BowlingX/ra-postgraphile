# ra-postgraphile

[![CircleCI](https://circleci.com/gh/BowlingX/ra-postgraphile.svg?style=svg)](https://circleci.com/gh/BowlingX/ra-postgraphile)
[![npm version](https://badge.fury.io/js/ra-postgraphile.svg)](https://badge.fury.io/js/ra-postgraphile)

Postgraphile client for react-admin

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
        <Resource
          name="Posts"
          list={PostList}
          edit={PostEdit}
          create={PostCreate}
        />
        <Resource
          name="Comments"
          list={CommentList}
          create={CommentCreate}
          edit={CommentEdit}
        />
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
const PgConnectionFilterPostgisPlugin = require('postgraphile-plugin-connection-filter-postgis')
```

## Configuration

You can pass an _optional_ configuration object:

```js
const pgDataProviderConfig = {
  queryValueToInputValueMap: {
    GeographyPoint: value => value.geojson
  }
}
```

- `queryValueToInputValueMap` - allows you to specify a mapping of how a type should map if it's taken as an Input.
  Please see ([src/defaultValueInputTypeMapping](src/defaultValueInputTypeMapping.js)) for a default mapping.
  Your config will be merged with the defaults.

  The Map is also used to specify what complex types should be completely queried.
  By default only scalar and scalar[] fields are fetched.
