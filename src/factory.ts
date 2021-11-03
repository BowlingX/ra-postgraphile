import buildGraphQLProvider, { Options } from 'ra-data-graphql'
import type { ApolloClient } from '@apollo/client'
import { DataProvider } from 'ra-core'
import { buildQuery } from './buildQuery'
import { buildInTypeConfig } from './defaultTypeConfig'
import { ProviderOptions } from './types'

export const factory = <T = any>(
  client: ApolloClient<T>,
  options?: ProviderOptions,
  graphqlProviderOptions?: Omit<Options, 'client' | 'buildQuery'>
): Promise<DataProvider> => {
  const defaultAppliedOptions = {
    typeMap: {
      ...buildInTypeConfig,
      ...(options?.typeMap || {}),
    },
  }

  return buildGraphQLProvider({
    ...graphqlProviderOptions,
    client,
    buildQuery: buildQuery(defaultAppliedOptions),
  })
}
