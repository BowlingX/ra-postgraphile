import type { IntrospectionInputValue, IntrospectionSchema, IntrospectionType } from 'graphql'

export interface QueryInputTypeMapper {
  [id: string]: (value: any) => any
}

export interface ProviderOptions {
  /**
   * It's possible that a type has a different shape when a Query is used then when the Input/Patch is used
   */
  queryValueToInputValueMap: QueryInputTypeMapper
}

export interface GraphqlProviderOptions {
  introspection?: { schema: IntrospectionSchema }
}

export interface Factory {
  options: ProviderOptions
  graphqlOptions: GraphqlProviderOptions
}

export type SortDirection = 'ASC' | 'DESC'

export interface Query {
  args: Array<IntrospectionInputValue>
}

export interface QueryMap {
  [query: string]: Query
}

export interface TypeMap {
  [type: string]: IntrospectionType
}

export interface Response {
  data: any
}

// Constants

export const CAMEL_REGEX = /(.+?)([A-Z])/gm
export const NATURAL_SORTING = 'NATURAL'
