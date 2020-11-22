import type { IntrospectionInputValue, IntrospectionSchema, IntrospectionType } from 'graphql'
import { CREATE, DELETE, GET_LIST, GET_MANY, GET_MANY_REFERENCE, GET_ONE, UPDATE } from 'ra-core'

export type FetchQueryType =
  | typeof GET_MANY
  | typeof GET_LIST
  | typeof GET_ONE
  | typeof GET_MANY_REFERENCE
  | typeof DELETE
  | typeof UPDATE
  | typeof CREATE

export interface TypeConfig {
  /**
   * Allows you to map the value if used as an input type for mutations
   *
   * Some values might not convert 1:1 if returned from the query and used as an input
   */
  queryValueToInputValue?: (value: any) => any
  /**
   * Allows you to exclude certain fields, either by passing an array (e.g. `['field1', 'field2']`) or a function
   *
   * By default all `Scalar`s, `Enum`s and `List<Scalar|Enum>.` are queried.
   * If you have expansive computations that you don't want to expose to `react-admin`, this is the
   * perfect place to do so :).
   */
  excludeFields?: string[] | ((fieldName: string, fetchType: FetchQueryType) => boolean)
  /**
   * Same as exclude fields, but if provided will let you dynamically decide if a field is queried.
   * Will only pass fields of type `Scalar`, `Enum` and `List<Scalar|Enum>.`
   * You can only provide either `includeFields` or `excludeFields`.
   */
  includeFields?: string[] | ((fieldName: string, fetchType: FetchQueryType) => boolean)

  /**
   * Allows you to dynamically provide arguments for a given field
   */
  computeArgumentsForField?: (
    fieldName: string,
    args: ReadonlyArray<IntrospectionInputValue>
  ) => Record<string, any> | null
  /**
   * Will expand this type, by default only `Scalar`s, `Enum`s and `List<Scalar|Enum>.` are expanded.
   * Make sure you expand subtypes as well if required.
   */
  expand?: boolean
}

export interface TypeConfigMap {
  [type: string]: TypeConfig
}

export interface ProviderOptions {
  typeMap: TypeConfigMap
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

// Most operators are from https://github.com/graphile-contrib/postgraphile-plugin-connection-filter/blob/master/src/PgConnectionArgFilterOperatorsPlugin.js#L42-L277
export type Operator =
  // Standard Operators
  | 'isNull'
  | 'equalTo'
  | 'notEqualTo'
  | 'distinctFrom'
  | 'notDistinctFrom'
  | 'in'
  | 'notIn'

  // Pattern Matching Operators
  | 'includes'
  | 'notIncludes'
  | 'includesInsensitive'
  | 'notIncludesInsensitive'
  | 'startsWith'
  | 'notStartsWith'
  | 'startsWithInsensitive'
  | 'notStartsWithInsensitive'
  | 'endsWith'
  | 'notEndsWith'
  | 'endsWithInsensitive'
  | 'notEndsWithInsensitive'
  | 'like'
  | 'notLike'
  | 'likeInsensitive'
  | 'notLikeInsensitive'

  // HStore / JSON / INET Operators
  | 'contains'
  | 'containsKey'
  | 'containsAllKeys'
  | 'containsAnyKeys'
  | 'containedBy'
  | 'containedByOrEqualTo'
  | 'containsOrContainedBy'

  // operators from https://github.com/mlipscombe/postgraphile-plugin-fulltext-filter
  | 'matches'

export interface FilterSpec {
  operator: Operator
  value: any
}

export interface Filter {
  [key: string]: {
    [operator: string]: any
  }
}

export interface FilterMap {
  and: Filter[]
}

// Constants

export const CAMEL_REGEX = /(.+?)([A-Z])/gm
export const NATURAL_SORTING = 'NATURAL'
