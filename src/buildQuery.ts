import gql from 'graphql-tag'
import pluralize, { singular } from 'pluralize'
import type { IntrospectionNamedTypeRef, IntrospectionSchema, IntrospectionType } from 'graphql'
import {
  GET_MANY,
  GET_LIST,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  GET_ONE,
  GET_MANY_REFERENCE,
  DELETE_MANY,
  DELETE,
} from 'ra-core'
import type {
  GetManyReferenceParams,
  UpdateManyParams,
  CreateParams,
  DeleteManyParams,
  GetListParams,
  GetManyParams,
  GetOneParams,
  DeleteParams,
  ListParams,
  UpdateParams,
  Identifier,
} from 'ra-core'
import type { BuildQueryResult } from 'ra-data-graphql'
import { createFilter } from './filters'
import { getManyReference } from './getManyReference'
import {
  capitalize,
  createGetListQuery,
  createGetManyQuery,
  createQueryFromType,
  createSortingKey,
  createTypeMap,
  escapeIdType,
  preparePrimaryKey,
  lowercase,
  mapInputToVariables,
  stripUndefined,
} from './utils'

import {
  NATURAL_SORTING,
  QueryMap,
  Response,
  TypeMap,
  SortDirection,
  ProviderOptions,
  TypeConfigMap,
} from './types'

// cache for all types
let typeMap: TypeMap
let queryMap: QueryMap

export const mapType = (
  idType: IntrospectionNamedTypeRef<any>,
  value: string | number,
  typeConfigMap?: TypeConfigMap
) => {
  const mapped = typeConfigMap?.[idType.name]?.queryValueToInputValue?.(value)
  const intIfParseable = (): string | number => {
    const parsedInt = parseInt(value as string)
    return isNaN(parsedInt) ? String(value) : parsedInt
  }

  // return the custom value if we have it
  return mapped !== undefined
    ? mapped
    : // preserve defaulted string behavior for these datatypes
    ['uuid', 'string'].includes(idType.name.toLowerCase())
    ? value
    : // default behavior is to cast to int if parseable, otherwise string
      intIfParseable()
}

type IntrospectionResult = {
  schema: IntrospectionSchema
  types: ReadonlyArray<IntrospectionType>
  queries: Array<any>
  resources: Array<any>
}

type AllParams =
  | GetOneParams
  | GetManyReferenceParams
  | UpdateManyParams
  | CreateParams
  | DeleteManyParams
  | GetListParams
  | GetManyParams
  | DeleteParams
  | ListParams
  | UpdateParams

export const buildQuery = (options: ProviderOptions) => (
  introspectionResults: IntrospectionResult
) => (raFetchType: string, resName: string, params: AllParams): BuildQueryResult => {
  if (!raFetchType || !resName) {
    throw new Error(`${raFetchType} / ${resName} is not yet implemented.`)
  }

  // By default we don't query for any complex types on the object, just scalars and scalars[]
  const typeMapConfiguration = options.typeMap

  // We do this here because react-admin is sometimes not consistent with the case (EditGuesser, etc)
  const resourceName = singular(resName)

  const resourceTypename = capitalize(resourceName)
  const { types, queries } = introspectionResults
  if (!queryMap) {
    queryMap = createTypeMap(queries)
  }
  if (!typeMap) {
    typeMap = createTypeMap(types)
  }

  const type = typeMap[resourceTypename]

  if (!type) {
    throw new Error(`Type "${resourceTypename}" did not exist in the introspection result.`)
  }

  const thisPluralize = typeMapConfiguration[resourceTypename]?.pluralize ?? pluralize

  const pluralizedResourceTypeName = thisPluralize(resourceTypename)
  const distinctPluralize = (str: string) => {
    const plural = thisPluralize(str)
    if (str !== plural) {
      return plural
    }
    if (
      plural.endsWith('ch') ||
      plural.endsWith('s') ||
      plural.endsWith('sh') ||
      plural.endsWith('x') ||
      plural.endsWith('z')
    ) {
      return plural + 'es'
    } else if (plural.endsWith('y')) {
      return plural.slice(0, -1) + 'ies'
    } else {
      return plural + 's'
    }
  }
  const manyLowerResourceName = lowercase(distinctPluralize(resourceTypename))
  const singleLowerResourceName = lowercase(resourceTypename)
  const primaryKey = preparePrimaryKey(
    queryMap[singleLowerResourceName],
    singleLowerResourceName,
    resourceTypename,
    type
  )
  const {
    deleteResourceName,
    getResourceName,
    updateResourceName,
    idKeyName,
    primaryKeyType: primaryKeyType,
  } = primaryKey

  switch (raFetchType) {
    case GET_ONE:
      return {
        query: gql`query ${getResourceName}($id: ${primaryKeyType.name}!) {
          ${getResourceName}(${idKeyName}: $id) {
          ${createQueryFromType(
            resourceTypename,
            typeMap,
            typeMapConfiguration,
            primaryKey,
            GET_ONE
          )}
        }
        }`,
        variables: {
          id: mapType(primaryKeyType, (params as GetOneParams).id, typeMapConfiguration),
        },
        parseResponse: (response: Response) => {
          return { data: response.data[getResourceName] }
        },
      }
    case GET_MANY:
      return {
        query: createGetManyQuery(
          type,
          manyLowerResourceName,
          resourceTypename,
          typeMap,
          queryMap,
          typeMapConfiguration,
          primaryKey,
          GET_MANY
        ),
        variables: {
          ids: (params as GetManyParams).ids
            .filter((v?: Identifier) => typeof v !== 'undefined')
            .map((id: string | number) => mapType(primaryKeyType, id, typeMapConfiguration)),
        },
        parseResponse: (response: Response) => {
          const { nodes } = response.data[manyLowerResourceName]
          return { data: nodes }
        },
      }
    case GET_MANY_REFERENCE:
      return getManyReference(
        params as GetManyReferenceParams,
        type,
        manyLowerResourceName,
        resourceTypename,
        pluralizedResourceTypeName,
        typeMap,
        queryMap,
        typeMapConfiguration,
        primaryKey,
        GET_MANY_REFERENCE
      )
    case GET_LIST: {
      const { filter, sort, pagination } = params as GetManyReferenceParams
      const { $condition: condition, ...pluginFilters } = filter || {}

      const orderBy =
        sort && sort.field && sort.order
          ? [createSortingKey(sort.field, sort.order as SortDirection)]
          : [NATURAL_SORTING]
      const filters = createFilter(pluginFilters, type)
      return {
        query: createGetListQuery(
          type,
          manyLowerResourceName,
          resourceTypename,
          pluralizedResourceTypeName,
          typeMap,
          queryMap,
          typeMapConfiguration,
          primaryKey,
          GET_LIST
        ),
        variables: stripUndefined({
          offset: (pagination.page - 1) * pagination.perPage,
          first: pagination.perPage,
          filter: filters,
          orderBy,
          condition,
        }),
        parseResponse: (response: Response) => {
          const { nodes, totalCount } = response.data[manyLowerResourceName]
          return { data: nodes, total: totalCount }
        },
      }
    }
    case CREATE: {
      const variables = {
        input: {
          [singleLowerResourceName]: mapInputToVariables(
            (params as CreateParams).data,
            typeMap[`${resourceTypename}Input`],
            type,
            typeMapConfiguration
          ),
        },
      }
      return {
        variables,
        query: gql`mutation create${resourceTypename}($input: Create${resourceTypename}Input!) {
          create${resourceTypename} (
          input: $input
        ) {
          ${singleLowerResourceName} {
          ${createQueryFromType(
            resourceTypename,
            typeMap,
            typeMapConfiguration,
            primaryKey,
            CREATE
          )}
        }
        }
        }`,
        parseResponse: (response: Response) => ({
          data: response.data[`create${resourceTypename}`][singleLowerResourceName],
        }),
      }
    }
    case DELETE: {
      return {
        variables: {
          input: {
            [primaryKey.idKeyName]: mapType(
              primaryKeyType,
              (params as DeleteParams).id,
              typeMapConfiguration
            ),
          },
        },
        query: gql`
          mutation ${deleteResourceName}($input: ${capitalize(deleteResourceName)}Input!) {
            ${deleteResourceName}(input: $input) {
              ${singleLowerResourceName} {
                ${createQueryFromType(
                  resourceTypename,
                  typeMap,
                  typeMapConfiguration,
                  primaryKey,
                  DELETE
                )}
              }
            }
          }
        `,
        parseResponse: (response: Response) => {
          return {
            data: response?.data[deleteResourceName][singleLowerResourceName],
          }
        },
      }
    }
    case DELETE_MANY: {
      const thisIds = (params as UpdateManyParams).ids
      const deletions = thisIds.map((id) => ({
        [primaryKey.idKeyName]: mapType(primaryKeyType, id, typeMapConfiguration),
        clientMutationId: id.toString(),
      }))
      return {
        variables: deletions.reduce(
          (next, input) => ({
            [`arg${escapeIdType(input[primaryKey.idKeyName])}`]: input,
            ...next,
          }),
          {}
        ),
        query: gql`
          mutation deleteMany${resourceTypename}(
          ${thisIds
            .map((id) => `$arg${escapeIdType(id)}: ${capitalize(deleteResourceName)}Input!`)
            .join(',')}
          ) {
            ${thisIds.map(
              (id: Identifier) => `
                k${escapeIdType(id)}:${deleteResourceName}(input: $arg${escapeIdType(id)}) {
                  clientMutationId
                }\n
                `
            )}
          }
        `,
        parseResponse: (response: Response) => ({
          data: thisIds.map((id: Identifier) =>
            mapType(
              primaryKeyType,
              response.data[`k${escapeIdType(id)}`].clientMutationId,
              typeMapConfiguration
            )
          ),
        }),
      }
    }
    case UPDATE: {
      const updateParams = params as UpdateParams
      const updateVariables = {
        input: {
          [primaryKey.idKeyName]: mapType(primaryKeyType, updateParams.id, typeMapConfiguration),
          patch: mapInputToVariables(
            updateParams.data,
            typeMap[`${resourceTypename}Patch`],
            type,
            typeMapConfiguration
          ),
        },
      }
      return {
        variables: updateVariables,
        query: gql`
          mutation ${updateResourceName}($input: Update${resourceTypename}Input!) {
            ${updateResourceName}(input: $input) {
            ${singleLowerResourceName} {
            ${createQueryFromType(
              resourceTypename,
              typeMap,
              typeMapConfiguration,
              primaryKey,
              UPDATE
            )}
          }
          }
          }
        `,
        parseResponse: (response: Response) => ({
          data: response.data[`${updateResourceName}`][singleLowerResourceName],
        }),
      }
    }
    case UPDATE_MANY: {
      const { ids, data } = params as UpdateManyParams
      const inputs = ids.map((id) => ({
        [primaryKey.idKeyName]: mapType(primaryKeyType, id, typeMapConfiguration),
        clientMutationId: id.toString(),
        patch: mapInputToVariables(
          data,
          typeMap[`${resourceTypename}Patch`],
          type,
          typeMapConfiguration
        ),
      }))
      return {
        variables: inputs.reduce(
          (next, input) => ({
            [`arg${escapeIdType(input[primaryKey.idKeyName])}`]: input,
            ...next,
          }),
          {}
        ),
        query: gql`mutation updateMany${resourceTypename}(
        ${ids.map((id) => `$arg${escapeIdType(id)}: Update${resourceTypename}Input!`).join(',')}) {
          ${inputs.map((input) => {
            return `
             update${escapeIdType(
               input[primaryKey.idKeyName]
             )}:${updateResourceName}(input: $arg${escapeIdType(input[primaryKey.idKeyName])}) {
               clientMutationId
             }
            `
          })}
        }`,
        parseResponse: (response: Response) => ({
          data: ids.map((id) =>
            mapType(
              primaryKeyType,
              response.data[`update${escapeIdType(id)}`].clientMutationId,
              typeMapConfiguration
            )
          ),
        }),
      }
    }
    default:
      throw new Error(`${raFetchType} is not yet implemented.`)
  }
}
