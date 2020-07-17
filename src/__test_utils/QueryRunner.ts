require('dotenv').config()
import { introspectionFromSchema } from 'graphql'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { Pool } from 'pg'
import { createPostGraphileSchema } from 'postgraphile'

import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector'
// @ts-ignore
import PgConnectionFilterPlugin from 'postgraphile-plugin-connection-filter'
import GraphileLink from './GraphileLink'

export async function makeQueryRunner(
  connectionString = process.env.DATABASE_URL || 'postgres:///',
  schemaName = process.env.DATABASE_SCHEMA || 'app_public',
  options = {
    appendPlugins: [PgSimplifyInflectorPlugin, PgConnectionFilterPlugin],
  } // See https://www.graphile.org/postgraphile/usage-schema/ for options
) {
  const pgPool = new Pool({
    connectionString,
  })

  // Create the PostGraphile schema
  const schema = await createPostGraphileSchema(connectionString, schemaName, options)
  const introspection = introspectionFromSchema(schema, { descriptions: true })

  // @ts-ignore
  const apolloClient = new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache(),
    link: new GraphileLink({ pgPool, schema }),
  })

  const release = () => {
    pgPool.end()
  }

  return {
    release,
    apolloClient,
    schema: introspection.__schema,
  }
}
