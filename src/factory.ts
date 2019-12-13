import buildGraphQLProvider from 'ra-data-graphql'
import { defaultQueryValueToInputValueMap } from './defaultValueInputTypeMapping'
import { ProviderOptions } from './types'
import { buildQuery } from './buildQuery'

export const factory = (
  client: any,
  options: ProviderOptions = { queryValueToInputValueMap: {} }
) => {
  const defaultAppliedOptions = {
    queryValueToInputValueMap: {
      ...defaultQueryValueToInputValueMap,
      ...(options.queryValueToInputValueMap || {})
    }
  }

  return buildGraphQLProvider({
    client,
    buildQuery,
    options: defaultAppliedOptions
  })
}
