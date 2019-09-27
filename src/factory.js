// @flow

import buildGraphQLProvider from 'ra-data-graphql'
import { defaultQueryValueToInputValueMap } from './defaultValueInputTypeMapping'
import type { ProviderOptions } from './types'
import { buildQuery } from './buildQuery'

export const factory = (client: Object, options: ProviderOptions = {}) => {
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
