import type {
  IntrospectionNamedTypeRef,
  IntrospectionObjectType,
  IntrospectionNonNullTypeRef,
  IntrospectionType,
} from 'graphql'

export const mapFilterType = (type: IntrospectionNamedTypeRef, value: any, key: string) => {
  const normalizedName = type.name.toLowerCase()
  switch (normalizedName) {
    case 'boolean':
      return {
        [key]: {
          equalTo: value,
        },
      }
    case 'string':
      return {
        or: [
          {
            [key]: {
              equalTo: value,
            },
          },
          {
            [key]: {
              like: `%${value}%`,
            },
          },
        ],
      }
    case 'uuid':
    case 'bigint':
    case 'int':
      return Array.isArray(value)
        ? {
            [key]: {
              in: value,
            },
          }
        : {
            [key]: {
              equalTo: value,
            },
          }
    default:
      throw new Error(`Filter for type ${type.name} not implemented.`)
  }
}

export const createFilter = (fields: any, type: IntrospectionType) => {
  const empty = [] as object[]
  const filters = Object.keys(fields).reduce((next, key) => {
    const maybeType = (type as IntrospectionObjectType).fields.find((f: any) => f.name === key)
    if (maybeType) {
      const thisType = (maybeType.type as IntrospectionNonNullTypeRef).ofType || maybeType.type
      return [...next, mapFilterType(thisType as IntrospectionNamedTypeRef, fields[key], key)]
    }
    return next
  }, empty)
  if (filters === empty) {
    return undefined
  }
  return { and: filters }
}
