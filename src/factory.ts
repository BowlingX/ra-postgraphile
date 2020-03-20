import buildGraphQLProvider from 'ra-data-graphql'
import { buildQuery } from './buildQuery'
import { defaultQueryValueToInputValueMap } from './defaultValueInputTypeMapping'
import { ProviderOptions, GraphqlProviderOptions } from './types'

export const factory = (
  client: any,
  options: ProviderOptions = { queryValueToInputValueMap: {} },
  graphqlProviderOptions: GraphqlProviderOptions = {}
) => {
  const defaultAppliedOptions = {
    queryValueToInputValueMap: {
      ...defaultQueryValueToInputValueMap,
      ...(options.queryValueToInputValueMap || {})
    }
  }

  return buildGraphQLProvider({
    ...graphqlProviderOptions,
    client,
    buildQuery,
    options: defaultAppliedOptions
  })
}
