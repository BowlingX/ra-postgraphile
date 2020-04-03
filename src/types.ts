import { GraphQLObjectType, IntrospectionSchema } from 'graphql'

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
  introspection?: {
    resources?: Record<string, any>[]
    queries?: Record<string, any>[]
    types?: GraphQLObjectType[]
    schema?: IntrospectionSchema
  }
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
    args: Array<{
      name: string
    }>
  }
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

export const VERB_GET_ONE = 'GET_ONE'
export const VERB_GET_MANY = 'GET_MANY'
export const VERB_GET_MANY_REFERENCE = 'GET_MANY_REFERENCE'
export const VERB_GET_LIST = 'GET_LIST'
export const VERB_CREATE = 'CREATE'
export const VERB_DELETE = 'DELETE'
export const VERB_DELETE_MANY = 'DELETE_MANY'
export const VERB_UPDATE = 'UPDATE'
export const VERB_UPDATE_MANY = 'UPDATE_MANY'
