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

Please see [src/\_\_test_utils/QueryRunner.ts](src/__test_utils/QueryRunner.ts) for a minimal
example setup.

For full-text search capabilities, the following plugin is also required:

```js
const PostGraphileFulltextFilterPlugin = require('postgraphile-plugin-fulltext-filter')
```

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
| `excludeFields`            | `string[] or ((fieldName: string, queryFetchType: FetchQueryType) => boolean)`                       | Allows you to exclude certain fields, either by passing an array (e.g. `['field1', 'field2']`) or a function                                          |
| `includeFields`            | `string[] or ((fieldName: string, queryFetchType: FetchQueryType) => boolean)`                       | Same as exclude fields, but if provided will let you dynamically decide if a field is queried.                                                        |
| `computeArgumentsForField` | `(fieldName: string, args: ReadonlyArray<IntrospectionInputValue> ) => Record< string, any> or null` | Allows you to dynamically provide arguments for a given field                                                                                         |
| `expand`                   | `boolean`                                                                                            | If true, will expand this type and query subfields                                                                                                    |
| `pluralize`                | `(value: string ) => string`                                                                         | Optional pluralization of resource name (uses `pluralize` by default)                                                                                 |

Please see ([src/types.ts](src/types.ts)) for detailed types of `TypeConfig`.

### Supported Apollo client versions

If you require support for `apollo-client` v2 please use version `<6`, otherwise use `>=6`.

**I recommend to upgrade to `@apollo/client` v3 packages because the core graphql data provider
requires version 3 in it's latest versions.**

## Supported concepts

`ra-postgraphile` works on graphql types that are exposed by `postgraphile`.
We currently support the following constructs to query data:

- `Tables`
- `Views`
- `Functions` with custom return type.

Please see [here](migrations/committed/000001.sql) for an example schema.

### Primary Keys

`react-admin` requires each resource to be identified by a unique `id`. If your resource does not
have an `id` field,
we alias the id field to your `primaryKey`. All types processed by `ra-postgraphile` require a
primary key.

### Custom filters

The library will use the `postgraphile-plugin-connection-filter` filter property by default to apply
filters specified (e.g. for `<List filters={...} />`).

#### Default Behaviour

| Type        | example filter         |
| ----------- | ---------------------- |
| `string`    | `{ includes: 'value'}` |
| `array`     | `{ in: [1,2,3] }`      |
| `numeric`   | `{ equalTo: 100 }`     |
| `boolean`   | `{ equalTo: true }`    |
| `...others` | `{ equalTo: 'ENUM' }`  |

Multiple fields will then be merged with `and` and send to `postgraphile` e.g.:

```json
{
  "and": [
    {
      "field": {
        "includes": "value"
      }
    }
  ]
}
```

To customize a filter, you have to provide a `parse` and `format` function to the actual input
Component. You can then customize the filter operation:

##### Text Example

```tsx
import type { FilterSpec } from 'ra-postgraphile'

const startsWithInsensitive = {
  parse: (value: string): FilterSpec => {
    return {
      operator: 'startsWithInsensitive',
      value,
    }
  },
  format: (v: FilterSpec) => v?.value || '',
}

const Filters = (props: Record<string, unknown>) => (
  <Filter {...props}>
    <TextInput label="Search" source="name" alwaysOn {...startsWithInsensitive} />
  </Filter>
)
```

This will then be transformed to

```json
{
  "and": [
    {
      "field": {
        "startsWithInsensitive": "value"
      }
    }
  ]
}
```

##### Nested Filters example

It's also possible to define multiple filters per field to create nested filters

```ts
const filterThatFiltersMultipleFields = {
  parse: (value: string) => ({
    value: value
      ? [
          {
            firstKey: { every: { someReferenceId: { equalTo: value } } },
            secondKey: { every: { someReferenceId: { equalTo: value } } },
          },
        ]
      : {},
    key: 'or' /* can be or, and etc... */,
  }),
  format: (value: any) => value?.value?.[0]?.firstKey?.every?.someReferenceId?.equalTo,
}
```

This will be transformed to a filter like

```json
{
  "and": [
    {
      "or": [
        {
          "firstKey": {
            "every": {
              "someReferenceId": {
                "equalTo": "value"
              }
            }
          },
          "secondKey": {
            "every": {
              "someReferenceId": {
                "equalTo": "value"
              }
            }
          }
        }
      ]
    }
  ]
}
```

## Contribution

- Contribution is very welcome :).
- Please create your commit messages based
  on [semantic-release syntax](https://github.com/semantic-release/semantic-release#how-does-it-work)
  and semantics (e.g. properly mark Breaking changes etc.).
  This let's us automatically create release notes and releases to NPM.

## Development

We are using `yarn` for package management.

To run all tests you have to start the dependent postgres container with `docker-compose up -d`.
