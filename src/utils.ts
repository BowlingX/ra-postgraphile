import gql from 'graphql-tag'
import { TypeKind } from 'graphql'

import type {
  IntrospectionEnumType,
  IntrospectionType,
  IntrospectionField,
  IntrospectionObjectType,
  IntrospectionListTypeRef,
  IntrospectionNonNullTypeRef,
} from 'graphql'
import {
  IntrospectionNamedTypeRef,
  IntrospectionOutputType,
} from 'graphql/utilities/introspectionQuery'
import { CAMEL_REGEX, Query, QueryInputTypeMapper, QueryMap, SortDirection, TypeMap } from './types'

const ARGUMENT_FILTER = 'filter'
const ARGUMENT_ORDER_BY = 'orderBy'

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)
export const lowercase = (str: string) => str[0].toLowerCase() + str.slice(1)

export const snake = (camelCaseInput: string) => camelCaseInput.replace(CAMEL_REGEX, '$1_$2')

const fieldIsObjectOrListOfObject = (field: any) =>
  field.type.kind === TypeKind.OBJECT ||
  (field.type.ofType &&
    (field.type.ofType.kind === TypeKind.OBJECT || field.type.ofType.kind === TypeKind.LIST))

export const createSortingKey = (field: string, sort: SortDirection) => {
  return `${snake(field).toUpperCase()}_${sort.toUpperCase()}`
}

export const escapeIdType = (id: any) => String(id).replace(/-/gi, '_')

// Maps any input object to variables of a mutation. Passes certain types through a mapping process.
export const mapInputToVariables = (
  input: any,
  inputType: any,
  type: any,
  typeMapper: QueryInputTypeMapper
) => {
  const inputFields = inputType.inputFields
  return inputFields.reduce((current: any, next: any) => {
    const key = next.name
    if (input[key] === undefined) {
      return current
    }
    const fieldType = type.fields.find(
      (field: any) => fieldIsObjectOrListOfObject(field) && field.name === key
    )
    if (fieldType) {
      const valueMapperForType = typeMapper[fieldType.type.ofType.name]
      if (valueMapperForType) {
        return {
          ...current,
          [key]: valueMapperForType(input[key]),
        }
      }
    }
    return {
      ...current,
      [key]: input[key],
    }
  }, {})
}

export const queryHasArgument = (type: string, argument: string, queryMap: QueryMap) => {
  if (!queryMap[type]) {
    return false
  }
  return Boolean(queryMap[type].args.find((f) => f.name === argument))
}

type PossibleListCases = IntrospectionListTypeRef<IntrospectionObjectType | IntrospectionEnumType>
type PossibleListNonNullCases = IntrospectionListTypeRef<
  IntrospectionNonNullTypeRef<IntrospectionObjectType | IntrospectionEnumType>
>

export const createQueryFromType = (
  type: string,
  typeMap: TypeMap,
  allowedTypes: string[],
  primaryKey: PrimaryKey
): string => {
  return (typeMap[type] as IntrospectionObjectType).fields.reduce(
    (current: any, field: IntrospectionField) => {
      // we have to skip fields that require arguments
      if ((field as IntrospectionField).args && (field as IntrospectionField).args.length > 0) {
        // TODO: allow arguments to be set
        return current
      }

      // We alias the primaryKey to `nodeId` to keep react-admin happy
      const fieldName =
        primaryKey.field === field && primaryKey.shouldRewrite
          ? `id: ${primaryKey.idKeyName} ${primaryKey.primaryKeyName}`
          : field.name

      if (fieldIsObjectOrListOfObject(field)) {
        const thisType: IntrospectionObjectType | IntrospectionEnumType =
          (field.type as PossibleListCases).ofType &&
          ((field.type as PossibleListCases).ofType.name
            ? (field.type as PossibleListCases).ofType
            : // We also handle cases where we have e.g. [TYPE!] (List of type)
              (field.type as PossibleListNonNullCases).ofType.ofType)
        const typeName = thisType && thisType.name
        if (typeName && allowedTypes.indexOf(typeName) !== -1) {
          return `
        ${current} ${field.name} {${createQueryFromType(
            typeName,
            typeMap,
            allowedTypes,
            primaryKey
          )} }
        `
        }
        if (!thisType || thisType.kind !== TypeKind.ENUM) {
          return current
        }
      }
      return `${current} ${fieldName}`
    },
    ''
  )
}

export const createGetManyQuery = (
  type: any,
  manyLowerResourceName: string,
  resourceTypename: string,
  typeMap: any,
  queryMap: QueryMap,
  allowedTypes: string[],
  primaryKey: PrimaryKey
) => {
  if (!queryHasArgument(manyLowerResourceName, ARGUMENT_FILTER, queryMap)) {
    return gql`query ${manyLowerResourceName}{
      ${manyLowerResourceName} {
      nodes {
        ${createQueryFromType(resourceTypename, typeMap, allowedTypes, primaryKey)}
      }
    }
    }`
  }
  return gql`
    query ${manyLowerResourceName}($ids: [${primaryKey.primaryKeyType.name}!]) {
      ${manyLowerResourceName}(filter: { id: { in: $ids }}) {
      nodes {
        ${createQueryFromType(resourceTypename, typeMap, allowedTypes, primaryKey)}
      }
    }
    }`
}

export const createGetListQuery = (
  type: any,
  manyLowerResourceName: string,
  resourceTypename: string,
  pluralizedResourceTypeName: string,
  typeMap: any,
  queryMap: QueryMap,
  allowedTypes: string[],
  primaryKey: PrimaryKey
) => {
  const hasFilters = queryHasArgument(manyLowerResourceName, ARGUMENT_FILTER, queryMap)
  const hasOrdering = queryHasArgument(manyLowerResourceName, ARGUMENT_ORDER_BY, queryMap)

  if (!hasFilters && !hasOrdering) {
    return gql`query ${manyLowerResourceName}($offset: Int!, $first: Int!) {
      ${manyLowerResourceName}(first: $first, offset: $offset) {
      nodes {
        ${createQueryFromType(resourceTypename, typeMap, allowedTypes, primaryKey)}
      }
      totalCount
    }
    }`
  }

  if (!hasFilters) {
    return gql`query ${manyLowerResourceName} (
    $offset: Int!,
    $first: Int!,
    $orderBy: [${pluralizedResourceTypeName}OrderBy!]
    ) {
      ${manyLowerResourceName}(first: $first, offset: $offset, orderBy: $orderBy) {
      nodes {
        ${createQueryFromType(resourceTypename, typeMap, allowedTypes, primaryKey)}
      }
      totalCount
    }
    }`
  }

  return gql`query ${manyLowerResourceName} (
  $offset: Int!,
  $first: Int!,
  $filter: ${resourceTypename}Filter,
  $orderBy: [${pluralizedResourceTypeName}OrderBy!]
  ) {
    ${manyLowerResourceName}(first: $first, offset: $offset, filter: $filter, orderBy: $orderBy) {
    nodes {
      ${createQueryFromType(resourceTypename, typeMap, allowedTypes, primaryKey)}
    }
    totalCount
  }
  }`
}

export const createTypeMap = (types: ReadonlyArray<IntrospectionType>) => {
  return types.reduce((map, next) => {
    return {
      ...map,
      [next.name]: next,
    }
  }, {})
}

export const stripUndefined = <T extends Record<string, any>>(variables: T) =>
  Object.keys(variables).reduce((next, key) => {
    if (variables[key] === undefined) {
      return next
    }
    return {
      ...next,
      [key]: variables[key],
    }
  }, {})

const findTypeByName = (type: IntrospectionType, name: string) =>
  (type as IntrospectionObjectType).fields?.find((thisType: any) => thisType.name === name)

type RequiredPrimaryKeyType =
  | IntrospectionNamedTypeRef<IntrospectionOutputType>
  | IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef<IntrospectionOutputType>>

interface PrimaryKey {
  idKeyName: string
  primaryKeyType: IntrospectionNamedTypeRef<IntrospectionOutputType>
  field: IntrospectionField
  primaryKeyName: string
  getResourceName: string
  deleteResourceName: string
  updateResourceName: string
  shouldRewrite: boolean
}

export const preparePrimaryKey = (
  query: Query,
  resourceName: string,
  resourceTypename: string,
  type: IntrospectionType
): PrimaryKey => {
  const primaryKeyName = query.args[0]?.name
  const field = findTypeByName(type, primaryKeyName)
  let primaryKeyType: RequiredPrimaryKeyType | undefined = field?.type as
    | RequiredPrimaryKeyType
    | undefined

  if (!primaryKeyType) {
    throw new Error(`Could not determine primaryKey on type ${resourceTypename} field.
      Please add a primary key to ${resourceTypename}`)
  }

  if (((primaryKeyType as any) as IntrospectionNonNullTypeRef)?.ofType) {
    primaryKeyType = (primaryKeyType as IntrospectionNonNullTypeRef<
      IntrospectionNamedTypeRef<IntrospectionOutputType>
    >)?.ofType
  }

  if (primaryKeyName !== 'id') {
    return {
      field: field as IntrospectionField,
      idKeyName: 'nodeId',
      primaryKeyName,
      primaryKeyType: primaryKeyType as IntrospectionNamedTypeRef<IntrospectionOutputType>,
      getResourceName: `${resourceName}ByNodeId`,
      deleteResourceName: `delete${resourceTypename}ByNodeId`,
      updateResourceName: `update${resourceTypename}ByNodeId`,
      shouldRewrite: true,
    }
  }

  return {
    field: field as IntrospectionField,
    idKeyName: 'id',
    primaryKeyName,
    primaryKeyType: primaryKeyType as IntrospectionNamedTypeRef<IntrospectionOutputType>,
    getResourceName: `${resourceName}`,
    deleteResourceName: `delete${resourceTypename}`,
    updateResourceName: `update${resourceTypename}`,
    shouldRewrite: false,
  }
}
