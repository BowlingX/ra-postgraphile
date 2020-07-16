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
  introspection?: IntrospectionSchema
}

export interface Factory {
  options: ProviderOptions
  graphqlOptions: GraphqlProviderOptions
}

export type SortDirection = 'ASC' | 'DESC'

export interface UpdateManyParams {
  ids: Array<number | string>
  data: any
}

export interface QueryMap {
  [query: string]: {
    args: Array<IntrospectionInputValue>
  }
}

export interface TypeMap {
  [type: string]: IntrospectionType
}

export interface ManyReferenceParams {
  filter: any
  sort: { field: string; order: SortDirection }
  target: string
  id: number
  pagination: { page: number; perPage: number }
}

export interface Response {
  data: any
}

// Constants

export const CAMEL_REGEX = /(.+?)([A-Z])/gm
export const NATURAL_SORTING = 'NATURAL'
