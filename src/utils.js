// @flow
import gql from 'graphql-tag'
import { CAMEL_REGEX, NODE_INTERFACE } from './types'
import type { QueryInputTypeMapper, SortDirection } from './types'

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)
export const lowercase = (str: string) => str[0].toLowerCase() + str.slice(1)

export const snake = (camelCaseInput: string) =>
  camelCaseInput.replace(CAMEL_REGEX, '$1_$2')

const fieldIsObjectOrListOfObject = (field: Object) =>
  field.type.kind === 'OBJECT' ||
  (field.type.ofType &&
    (field.type.ofType.kind === 'OBJECT' || field.type.ofType.kind === 'LIST'))

export const createSortingKey = (field: string, sort: SortDirection) => {
  return `${snake(field).toUpperCase()}_${sort}`
}

// Maps any input object to variables of a mutation. Passes certain types through a mapping process.
export const mapInputToVariables = (
  input: Object,
  inputType: Object,
  type: Object,
  typeMapper: QueryInputTypeMapper
) => {
  const inputFields = inputType.inputFields
  return inputFields.reduce((current, next) => {
    const key = next.name
    if (input[key] === undefined) {
      return current
    }
    const fieldType = type.fields.find(
      field => fieldIsObjectOrListOfObject(field) && field.name === key
    )
    if (fieldType) {
      const valueMapperForType = typeMapper[fieldType.type.ofType.name]
      if (valueMapperForType) {
        return {
          ...current,
          [key]: valueMapperForType(input[key])
        }
      }
    }
    return {
      ...current,
      [key]: input[key]
    }
  }, {})
}

export const implementsInterface = (type: Object, name: string) =>
  type.interfaces.filter(_interface => _interface.name === name).length > 0

export const createGetManyQuery = (
  type: Object,
  manyLowerResourceName: string,
  resourceTypename: string,
  typeMap: Object,
  allowedTypes: Array<string>
) => {
  return implementsInterface(type, NODE_INTERFACE)
    ? gql`
              query ${manyLowerResourceName}($ids: [Int!]) {
                  ${manyLowerResourceName}(filter: { id: { in: $ids }}) {
                  nodes {
                      ${createQueryFromType(
                        resourceTypename,
                        typeMap,
                        allowedTypes
                      )}
                  }
              }
              }`
    : gql`
              query ${manyLowerResourceName} {
                  ${manyLowerResourceName} {
                  nodes {
                      ${createQueryFromType(
                        resourceTypename,
                        typeMap,
                        allowedTypes
                      )}
                  }
              }
              }
    `
}

export const createGetListQuery = (
  type: Object,
  manyLowerResourceName: string,
  resourceTypename: string,
  typeMap: Object,
  allowedTypes: Array<string>
) => {
  return implementsInterface(type, NODE_INTERFACE)
    ? gql`query ${manyLowerResourceName} (
          $offset: Int!,
          $first: Int!,
          $filter: ${resourceTypename}Filter,
          $orderBy: [${resourceTypename}sOrderBy!]
          ) {
              ${manyLowerResourceName}(first: $first, offset: $offset, filter: $filter, orderBy: $orderBy) {
              nodes {
                  ${createQueryFromType(
                    resourceTypename,
                    typeMap,
                    allowedTypes
                  )}
              }
              totalCount
          }
          }`
    : gql`query ${manyLowerResourceName}($offset: Int!, $first: Int!) {
              ${manyLowerResourceName}(first: $first, offset: $offset) {
              nodes {
                  ${createQueryFromType(
                    resourceTypename,
                    typeMap,
                    allowedTypes
                  )}
              }
              totalCount
          }
          }`
}

export const createTypeMap = (types: Array<Object>) => {
  return types.reduce((map, next) => {
    return {
      ...map,
      [next.name]: next
    }
  }, {})
}

export const createQueryFromType = (
  type: string,
  typeMap: Object,
  allowedTypes: Array<string>
) => {
  return typeMap[type].fields.reduce((current, field) => {
    if (fieldIsObjectOrListOfObject(field)) {
      const type =
        field.type.ofType &&
        // We also handle cases where we have e.g. [TYPE!] (List of type)
        (field.type.ofType.name ||
          (field.type.ofType.ofType && field.type.ofType.ofType.name))
      if (type && allowedTypes.indexOf(type) !== -1) {
        return `
        ${current} ${field.name} {${createQueryFromType(
          type,
          typeMap,
          allowedTypes
        )} }
        `
      }
      return current
    }
    return `${current} ${field.name}`
  }, '')
}
