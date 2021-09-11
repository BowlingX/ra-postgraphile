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

import { Factory, NATURAL_SORTING, QueryMap, Response, TypeMap, SortDirection } from './types'

// cache for all types
let typeMap: TypeMap
let queryMap: QueryMap

export const mapType = (idType: IntrospectionNamedTypeRef<any>, value: string | number) =>
  ['uuid', 'string'].includes(idType.name.toLowerCase()) ? value : parseInt(value as string, 10)

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

export const buildQuery = (introspectionResults: IntrospectionResult, factory: Factory) => (
  raFetchType: string,
  resName: string,
  params: AllParams
) => {
  if (!raFetchType || !resName) {
    return { data: null }
  }

  // We do this here because react-admin is sometimes not consistent with the case (EditGuesser, etc)
  const resourceName = singular(resName)

  const options = factory.options
  // By default we don't query for any complex types on the object, just scalars and scalars[]
  const typeMapConfiguration = options.typeMap

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

  const pluralizedResourceTypeName = pluralize(resourceTypename)
  const manyLowerResourceName = lowercase(pluralizedResourceTypeName)
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
          id: mapType(primaryKeyType, (params as GetOneParams).id),
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
            .map((id: string | number) => mapType(primaryKeyType, id)),
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
            [primaryKey.idKeyName]: mapType(primaryKeyType, (params as DeleteParams).id),
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
        [primaryKey.idKeyName]: mapType(primaryKeyType, id),
        clientMutationId: id.toString(),
      }))
      return {
        variables: deletions.reduce(
          (next, input) => ({
            [`arg${escapeIdType(input.id)}`]: input,
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
            mapType(primaryKeyType, response.data[`k${escapeIdType(id)}`].clientMutationId)
          ),
        }),
      }
    }
    case UPDATE: {
      const updateParams = params as UpdateParams
      const updateVariables = {
        input: {
          id: mapType(primaryKeyType, updateParams.id),
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
        id: mapType(primaryKeyType, id),
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
            [`arg${escapeIdType(input.id)}`]: input,
            ...next,
          }),
          {}
        ),
        query: gql`mutation updateMany${resourceTypename}(
        ${ids.map((id) => `$arg${escapeIdType(id)}: Update${resourceTypename}Input!`).join(',')}) {
          ${inputs.map((input) => {
            return `
             update${escapeIdType(input.id)}:${updateResourceName}(input: $arg${escapeIdType(
              input.id
            )}) {
               clientMutationId
             }
            `
          })}
        }`,
        parseResponse: (response: Response) => ({
          data: ids.map((id) =>
            mapType(primaryKeyType, response.data[`update${escapeIdType(id)}`].clientMutationId)
          ),
        }),
      }
    }
    default:
      throw new Error(`${raFetchType} is not yet implemented.`)
  }
}
