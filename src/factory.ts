import buildGraphQLProvider from 'ra-data-graphql'
import type { ApolloClient } from 'apollo-client'
import type { LegacyDataProvider } from 'ra-core'
import { buildQuery } from './buildQuery'
import { defaultQueryValueToInputValueMap } from './defaultValueInputTypeMapping'
import { ProviderOptions, GraphqlProviderOptions } from './types'

export const factory = <T = any>(
  client: ApolloClient<T>,
  options: ProviderOptions = { queryValueToInputValueMap: {} },
  graphqlProviderOptions: GraphqlProviderOptions = {}
): LegacyDataProvider => {
  const defaultAppliedOptions = {
    queryValueToInputValueMap: {
      ...defaultQueryValueToInputValueMap,
      ...(options.queryValueToInputValueMap || {}),
    },
  }

  return buildGraphQLProvider({
    ...graphqlProviderOptions,
    client,
    buildQuery,
    options: defaultAppliedOptions,
  })
}
