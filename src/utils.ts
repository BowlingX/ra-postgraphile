import gql from 'graphql-tag'

import { TypeKind } from 'graphql'

import type {
  IntrospectionEnumType,
  IntrospectionType,
  IntrospectionTypeRef,
  IntrospectionField,
  IntrospectionObjectType,
  IntrospectionListTypeRef,
  IntrospectionNonNullTypeRef,
  IntrospectionInputValue,
} from 'graphql'
import {
  IntrospectionNamedTypeRef,
  IntrospectionOutputType,
} from 'graphql/utilities/getIntrospectionQuery'
import {
  CAMEL_REGEX,
  Query,
  QueryMap,
  SortDirection,
  TypeConfig,
  TypeConfigMap,
  TypeMap,
  FetchQueryType,
} from './types'

const ARGUMENT_FILTER = 'filter'
const ARGUMENT_CONDITION = 'condition'
const ARGUMENT_ORDER_BY = 'orderBy'
const DEFAULT_ID_FIELD_NAME = 'id'

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)
export const lowercase = (str: string) => str[0].toLowerCase() + str.slice(1)

export const snake = (camelCaseInput: string) => camelCaseInput.replace(CAMEL_REGEX, '$1_$2')

const extractFromNonNull = <T extends IntrospectionTypeRef>(
  type: IntrospectionNonNullTypeRef<T> | T
) => {
  return type.kind === 'NON_NULL' ? (type as IntrospectionNonNullTypeRef<T>).ofType : type
}

const extractFromList = <T extends IntrospectionTypeRef>(type: IntrospectionListTypeRef<T> | T) => {
  return type.kind === 'LIST' ? (type as IntrospectionListTypeRef<T>).ofType : type
}

// Get the "base" type of a field. It can be wrapped in a few different ways:
// - TYPE (bare type)
// - TYPE! (non-null type)
// - [TYPE] (list of type)
// - [TYPE!] (list of non-null type)
// - [TYPE!]! (non-null list of non-null type)
const extractBaseType = <T extends IntrospectionTypeRef>(type: IntrospectionListTypeRef<T> | T) =>
  extractFromNonNull(extractFromList(extractFromNonNull(type)))

const fieldIsObjectOrListOfObject = (field: any) =>
  extractBaseType(field.type).kind === TypeKind.OBJECT

export const createSortingKey = (field: string, sort: SortDirection) => {
  return `${snake(field).toUpperCase()}_${sort.toUpperCase()}`
}

export const escapeIdType = (id: any) => String(id).replace(/[-\s]/gi, '_')

export const formatArgumentsAsQuery = (obj: any, level = 0) => {
  if (typeof obj === 'number') {
    return obj
  }
  if (Array.isArray(obj)) {
    const props: string = obj
      .map((value) => `${formatArgumentsAsQuery(value, level + 1)}`)
      .join(',')
    return `[${props}]`
  }
  if (typeof obj === 'object') {
    const props: string = Object.keys(obj)
      .map((key) => `${key}:${formatArgumentsAsQuery(obj[key], level + 1)}`)
      .join(',')
    return level === 0 ? props : `{${props}}`
  }
  return JSON.stringify(obj)
}

// Maps any input object to variables of a mutation. Passes certain types through a mapping process.
export const mapInputToVariables = (
  input: any,
  inputType: any,
  type: any,
  typeConfiguration: TypeConfigMap
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
      const valueMapperForType =
        typeConfiguration[fieldType?.type?.ofType?.name] || typeConfiguration[fieldType?.type?.name]
      if (valueMapperForType && valueMapperForType.queryValueToInputValue) {
        return {
          ...current,
          [key]: valueMapperForType.queryValueToInputValue(input[key]),
        }
      }
    }
    return {
      ...current,
      [key]: input[key],
    }
  }, {})
}

export const queryHasArgument = (
  type: string,
  argument: string,
  queryMap: QueryMap
): IntrospectionInputValue | undefined => {
  if (!queryMap[type]) {
    return undefined
  }
  return queryMap[type].args.find((f) => f.name === argument)
}

const shouldQueryField = (
  fieldName: string,
  typeConfig: TypeConfig,
  fetchQueryType: FetchQueryType
) => {
  if (typeConfig.includeFields) {
    if (typeof typeConfig.includeFields === 'function') {
      return typeConfig.includeFields(fieldName, fetchQueryType)
    }
    return typeConfig.includeFields.indexOf(fieldName) > -1
  }
  if (typeConfig.excludeFields) {
    if (typeof typeConfig.excludeFields === 'function') {
      return !typeConfig.excludeFields(fieldName, fetchQueryType)
    }
    return typeConfig.excludeFields.indexOf(fieldName) === -1
  }
  return true
}

const applyArgumentsForField = (
  fieldName: string,
  typeConfig: TypeConfig,
  args: ReadonlyArray<IntrospectionInputValue>
) => {
  if (typeConfig.computeArgumentsForField) {
    const result = typeConfig.computeArgumentsForField(fieldName, args)
    if (!result) {
      return fieldName
    }
    return `${fieldName}(${formatArgumentsAsQuery(result)})`
  }
  return fieldName
}

export const createQueryFromType = (
  type: string,
  typeMap: TypeMap,
  typeConfiguration: TypeConfigMap,
  primaryKey: PrimaryKey,
  fetchQueryType: FetchQueryType
): string => {
  return (typeMap[type] as IntrospectionObjectType).fields.reduce(
    (current: any, field: IntrospectionField) => {
      // we have to skip fields that require arguments
      const hasArguments =
        (field as IntrospectionField).args && (field as IntrospectionField).args.length > 0

      const thisTypeConfig = typeConfiguration[type]

      // We skip fields that have arguments without type config
      if (hasArguments && !thisTypeConfig) {
        return current
      }

      // We alias the primaryKey to `nodeId` to keep react-admin happy
      let fieldName =
        primaryKey.field === field && primaryKey.shouldRewrite
          ? `${DEFAULT_ID_FIELD_NAME}: ${primaryKey.idKeyName} ${primaryKey.primaryKeyName}`
          : field.name

      if (thisTypeConfig) {
        if (!shouldQueryField(fieldName, thisTypeConfig, fetchQueryType)) {
          return current
        }
        if (hasArguments) {
          fieldName = applyArgumentsForField(
            fieldName,
            thisTypeConfig,
            (field as IntrospectionField).args
          )
        }
      }

      if (fieldIsObjectOrListOfObject(field)) {
        const thisType = extractBaseType(field.type)
        const typeName =
          'name' in thisType ? thisType?.name : (field.type as IntrospectionObjectType).name
        const shouldExpand =
          typeName && typeConfiguration[typeName] && typeConfiguration[typeName].expand
        if (typeName && shouldExpand) {
          return `
        ${current} ${fieldName} {${createQueryFromType(
            typeName,
            typeMap,
            typeConfiguration,
            primaryKey,
            fetchQueryType
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
  typeConfiguration: TypeConfigMap,
  primaryKey: PrimaryKey,
  fetchQueryType: FetchQueryType
) => {
  if (!queryHasArgument(manyLowerResourceName, ARGUMENT_FILTER, queryMap)) {
    return gql`query ${manyLowerResourceName}{
      ${manyLowerResourceName} {
      nodes {
        ${createQueryFromType(
          resourceTypename,
          typeMap,
          typeConfiguration,
          primaryKey,
          fetchQueryType
        )}
      }
    }
    }`
  }
  return gql`
    query ${manyLowerResourceName}($ids: [${primaryKey.primaryKeyType.name}!]) {
      ${manyLowerResourceName}(filter: { ${primaryKey.primaryKeyName}: { in: $ids }}) {
      nodes {
        ${createQueryFromType(
          resourceTypename,
          typeMap,
          typeConfiguration,
          primaryKey,
          fetchQueryType
        )}
      }
    }
    }`
}

const hasOthersThenNaturalOrdering = (
  typeMap: TypeMap,
  orderingArgument:
    | IntrospectionListTypeRef<IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef>>
    | undefined
) => {
  const orderTypeName = orderingArgument?.ofType?.ofType?.name
  return orderTypeName && (typeMap[orderTypeName] as IntrospectionEnumType)?.enumValues?.length > 1
}

export const createGetListQuery = (
  type: IntrospectionType,
  manyLowerResourceName: string,
  resourceTypename: string,
  pluralizedResourceTypeName: string,
  typeMap: TypeMap,
  queryMap: QueryMap,
  typeConfiguration: TypeConfigMap,
  primaryKey: PrimaryKey,
  fetchQueryType: FetchQueryType
) => {
  const hasFilters = queryHasArgument(manyLowerResourceName, ARGUMENT_FILTER, queryMap)
  const hasCondition = queryHasArgument(manyLowerResourceName, ARGUMENT_CONDITION, queryMap)
  const ordering = queryHasArgument(manyLowerResourceName, ARGUMENT_ORDER_BY, queryMap)
  const hasOrdering = hasOthersThenNaturalOrdering(
    typeMap,
    ordering?.type as
      | IntrospectionListTypeRef<IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef>>
      | undefined
  )

  // conditions
  const conditionQueryArg = hasCondition && `$condition: ${resourceTypename}Condition`
  const conditionArg = hasCondition && 'condition: $condition'

  // order by
  const orderByQueryArg = hasOrdering && `$orderBy: [${pluralizedResourceTypeName}OrderBy!]`
  const orderByArg = hasOrdering && 'orderBy: $orderBy'

  // order by
  const filterQueryArg = hasFilters && `$filter: ${resourceTypename}Filter`
  const filterArg = hasFilters && 'filter: $filter'

  const allQueryArgs = [conditionQueryArg, orderByQueryArg, filterQueryArg].filter(Boolean)
  const allArgs = [conditionArg, orderByArg, filterArg].filter(Boolean)

  return gql`query ${manyLowerResourceName} (
  $offset: Int!,
  $first: Int!
  ${allQueryArgs.join(',\n')}
  ) {
    ${manyLowerResourceName}(
    first: $first,
    offset: $offset
    ${allArgs.join(',\n')}
    ) {
    nodes {
      ${createQueryFromType(
        resourceTypename,
        typeMap,
        typeConfiguration,
        primaryKey,
        fetchQueryType
      )}
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

const findTypeByName = (type: IntrospectionType, name: string | undefined) =>
  (type as IntrospectionObjectType).fields?.find((thisType: any) => thisType.name === name)

type RequiredPrimaryKeyType =
  | IntrospectionNamedTypeRef<IntrospectionOutputType>
  | IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef<IntrospectionOutputType>>

export interface PrimaryKey {
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
  query: Query | undefined,
  resourceName: string,
  resourceTypename: string,
  type: IntrospectionType
): PrimaryKey => {
  // in case we don't have any arguments we fall back to the default `id` type.
  const primaryKeyName = query?.args[0]?.name || DEFAULT_ID_FIELD_NAME
  const field = findTypeByName(type, primaryKeyName)
  let primaryKeyType: RequiredPrimaryKeyType | undefined = field?.type as
    | RequiredPrimaryKeyType
    | undefined

  if (!primaryKeyType || !primaryKeyName) {
    throw new Error(`Could not determine primaryKey on type ${resourceTypename} field.
      Please add a primary key to ${resourceTypename}`)
  }

  if (((primaryKeyType as any) as IntrospectionNonNullTypeRef)?.ofType) {
    primaryKeyType = (primaryKeyType as IntrospectionNonNullTypeRef<
      IntrospectionNamedTypeRef<IntrospectionOutputType>
    >)?.ofType
  }

  const shouldRewrite = primaryKeyName !== DEFAULT_ID_FIELD_NAME
  const idKeyName = shouldRewrite ? primaryKeyName : DEFAULT_ID_FIELD_NAME

  return {
    field: field as IntrospectionField,
    idKeyName,
    primaryKeyName,
    primaryKeyType: primaryKeyType as IntrospectionNamedTypeRef<IntrospectionOutputType>,
    getResourceName: resourceName,
    deleteResourceName: `delete${resourceTypename}`,
    updateResourceName: `update${resourceTypename}`,
    shouldRewrite,
  }
}
