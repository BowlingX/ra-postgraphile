import type {
  IntrospectionNamedTypeRef,
  IntrospectionObjectType,
  IntrospectionNonNullTypeRef,
  IntrospectionType,
} from 'graphql'

import type { Filter, FilterMap, FilterSpec, Operator } from './types'

/**
 * Transforms for a certain field type a search value for a field (the key)
 * to a filter that is understood by postgraphile.
 *
 * For example:
 *
 * - type: {kind: "SCALAR", name: "String", ofType: null, __typename: "__Type"}
 * - value: "some keyword"
 * - key: "name"
 *
 * Is transformed to:
 *
 * ```ts
 * {
 *   name: {
 *     includes: "some keyword"
 *   }
 * }
 * ```
 */
export const mapFilterType = (
  type: IntrospectionNamedTypeRef,
  value: any,
  key: string
): Filter | undefined => {
  if (Array.isArray(value)) {
    const spec: FilterSpec = {
      operator: 'in',
      value,
    }

    value = spec
  }

  if (typeof value !== 'object') {
    const typeName = (type?.name ?? '').toLowerCase()

    let operator: Operator = 'equalTo'
    // string uses includes as the default operator for historical reasons
    if (typeName === 'string') {
      operator = 'includes'
    }

    // a type of FullText uses matches as the default operator for historical reasons
    if (typeName === 'fulltext') {
      operator = 'matches'
      value = `${value}:*`
    }

    const spec: FilterSpec = {
      operator,
      value,
    }

    value = spec
  } else {
    // make sure object has a shape of FilterSpec
    if (value?.operator === undefined && !(typeof value?.value === 'object')) {
      throw new Error(`Alternative ${JSON.stringify(value)} filter is not of type FilterSpec`)
    }
  }

  const { operator, value: v, key: filterKey } = value

  // react-admin sends the value as undefined when the filter is cleared
  // rather than making every parse function handle that, deal with it here
  if (v === undefined) {
    return undefined
  }

  return {
    [filterKey || key]:
      typeof operator !== 'undefined'
        ? {
            [operator]: v,
          }
        : v,
  }
}

export const createFilter = (
  fields: { [key: string]: unknown },
  type: IntrospectionType
): FilterMap | undefined => {
  const empty: Filter[] = []

  const filters = Object.keys(fields).reduce((next, key) => {
    const maybeType = (type as IntrospectionObjectType).fields.find((f: any) => f.name === key)
    if (maybeType) {
      const thisType = (maybeType.type as IntrospectionNonNullTypeRef).ofType || maybeType.type

      const filter = mapFilterType(thisType as IntrospectionNamedTypeRef, fields[key], key)
      if (filter === undefined) {
        return next
      }

      return [...next, filter]
    }
    return next
  }, empty)

  if (filters === empty) {
    return undefined
  }

  return { and: filters }
}
