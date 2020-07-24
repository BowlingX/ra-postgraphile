import buildGraphQLProvider from 'ra-data-graphql'
import type { ApolloClient } from 'apollo-client'
import type { LegacyDataProvider } from 'ra-core'
import { buildQuery } from './buildQuery'
import { buildInTypeConfig } from './defaultTypeConfig'
import { ProviderOptions, GraphqlProviderOptions } from './types'

export const factory = <T = any>(
  client: ApolloClient<T>,
  options?: ProviderOptions,
  graphqlProviderOptions: GraphqlProviderOptions = {}
): LegacyDataProvider => {
  const defaultAppliedOptions = {
    typeMap: {
      ...buildInTypeConfig,
      ...(options?.typeMap || {}),
    },
  }

  return buildGraphQLProvider({
    ...graphqlProviderOptions,
    client,
    buildQuery,
    options: defaultAppliedOptions,
  })
}
