/* eslint-disable @typescript-eslint/no-var-requires */
import { SchemaLink } from 'apollo-link-schema'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
require('dotenv').config()
import { Pool } from 'pg'
import { createPostGraphileSchema, withPostGraphileContext } from 'postgraphile'

import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector'
// @ts-ignore
import PgConnectionFilterPlugin from 'postgraphile-plugin-connection-filter'

export async function makeQueryRunner(
  connectionString = process.env.DATABASE_URL || 'postgres:///',
  schemaName = process.env.DATABASE_SCHEMA || 'app_public',
  options = {
    appendPlugins: [PgSimplifyInflectorPlugin, PgConnectionFilterPlugin],
    graphileBuildOptions: {
      connectionFilterComputedColumns: false,
      connectionFilterRelations: true,
      nestedMutationsSimpleFieldNames: true,
    },
  } // See https://www.graphile.org/postgraphile/usage-schema/ for options
) {
  // Create the PostGraphile schema
  const schema = await createPostGraphileSchema(
    connectionString,
    schemaName,
    options
  )

  const pgPool = new Pool({
    connectionString,
  })

  // @ts-ignore
  const apolloClient: ApolloClient<any> = await withPostGraphileContext(
    { pgPool },
    // @ts-ignore
    (context) => {
      const client = new ApolloClient({
        ssrMode: true,
        cache: new InMemoryCache(),
        link: new SchemaLink({ schema, context }),
      })
      return Promise.resolve(client)
    }
  )

  const release = () => {
    pgPool.end()
  }

  return {
    schema,
    release,
    apolloClient,
  }
}
