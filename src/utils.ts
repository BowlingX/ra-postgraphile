import gql from 'graphql-tag'
import pluralize from 'pluralize'
import { CAMEL_REGEX, NODE_INTERFACE } from './types'
import { QueryInputTypeMapper, SortDirection } from './types'

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)
export const lowercase = (str: string) => str[0].toLowerCase() + str.slice(1)

export const snake = (camelCaseInput: string) =>
  camelCaseInput.replace(CAMEL_REGEX, '$1_$2')

const fieldIsObjectOrListOfObject = (field: any) =>
  field.type.kind === 'OBJECT' ||
  (field.type.ofType &&
    (field.type.ofType.kind === 'OBJECT' || field.type.ofType.kind === 'LIST'))

export const createSortingKey = (field: string, sort: SortDirection) => {
  return `${snake(field).toUpperCase()}_${sort}`
}

// Maps any input object to variables of a mutation. Passes certain types through a mapping process.
export const mapInputToVariables = (
  input: any,
  inputType: any,
  type: any,
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

// export const implementsInterface = (type: any, name: string) =>
//   type.interfaces.filter(_interface => _interface.name === name).length > 0

export const createGetManyQuery = (
  type: any,
  manyLowerResourceName: string,
  resourceTypename: string,
  typeMap: any,
  allowedTypes: Array<string>
) => {
  return gql`
    query ${manyLowerResourceName}($ids: [Int!]) {
        ${manyLowerResourceName}(filter: { id: { in: $ids }}) {
        nodes {
            ${createQueryFromType(resourceTypename, typeMap, allowedTypes)}
        }
      }
    }`
}

export const createGetListQuery = (
  type: any,
  manyLowerResourceName: string,
  resourceTypename: string,
  typeMap: any,
  allowedTypes: Array<string>
) => {
  return gql`query ${manyLowerResourceName} (
    $offset: Int!,
    $first: Int!,
    $filter: ${resourceTypename}Filter,
    $orderBy: [${pluralize(resourceTypename)}OrderBy!]
    ) {
        ${manyLowerResourceName}(first: $first, offset: $offset, filter: $filter, orderBy: $orderBy) {
        nodes {
            ${createQueryFromType(resourceTypename, typeMap, allowedTypes)}
        }
        totalCount
      }
    }`
}

export const createTypeMap = (types: Array<any>) => {
  return types.reduce((map, next) => {
    return {
      ...map,
      [next.name]: next
    }
  }, {})
}

export const createQueryFromType = (
  type: string,
  typeMap: any,
  allowedTypes: Array<string>
) => {
  return typeMap[type].fields.reduce((current, field) => {
    // we have to skip fields that require arguments
    if (field.args && field.args.length > 0) {
      return current
    }
    if (fieldIsObjectOrListOfObject(field)) {
      const type =
        field.type.ofType && // We also handle cases where we have e.g. [TYPE!] (List of type)
        (field.type.ofType.name ? field.type.ofType : field.type.ofType.ofType)
      const typeName = type && type.name
      if (typeName && allowedTypes.indexOf(typeName) !== -1) {
        return `
        ${current} ${field.name} {${createQueryFromType(
          typeName,
          typeMap,
          allowedTypes
        )} }
        `
      }
      if (!type || type.kind !== 'ENUM') {
        return current
      }
    }
    return `${current} ${field.name}`
  }, '')
}
