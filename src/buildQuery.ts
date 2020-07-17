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
  Factory,
  ManyReferenceParams,
  NATURAL_SORTING,
  QueryMap,
  Response,
  UpdateManyParams,
  TypeMap,
} from './types'

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

export const buildQuery = (introspectionResults: IntrospectionResult, factory: Factory) => (
  raFetchType: string,
  resName: string,
  params: any
) => {
  if (!raFetchType || !resName) {
    return { data: null }
  }

  // We do this here because react-admin is sometimes not consistent with the case (EditGuesser, etc)
  const resourceName = singular(resName)

  const options = factory.options
  // By default we don't query for any complex types on the object, just scalars and scalars[]
  const allowedComplexTypes = Object.keys(options.queryValueToInputValueMap)

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
    throw new Error(`Type "${resourceTypename}" did not exist in introspection result.`)
  }

  const pluralizedResourceTypeName = pluralize(resourceTypename)
  const manyLowerResourceName = lowercase(pluralizedResourceTypeName)
  const singleLowerResourceName = lowercase(resourceTypename)
  const primaryKey = preparePrimaryKey(
    queryMap[resourceName],
    singleLowerResourceName,
    resourceTypename,
    type
  )
  const {
    deleteResourceName,
    getResourceName,
    updateResourceName,
    idKeyName,
    primaryKeyType: idType,
  } = primaryKey

  switch (raFetchType) {
    case GET_ONE:
      return {
        query: gql`query ${getResourceName}($id: ${idType.name}!) {
            ${getResourceName}(${idKeyName}: $id) {
            ${createQueryFromType(resourceTypename, typeMap, allowedComplexTypes, primaryKey)}
        }
        }`,
        variables: {
          id: mapType(idType, params.id),
        },
        parseResponse: (response: Response) => {
          return { data: response.data[singleLowerResourceName] }
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
          allowedComplexTypes,
          primaryKey
        ),
        variables: {
          ids: params.ids
            .filter((v?: string) => typeof v !== 'undefined')
            .map((id: string | number) => mapType(idType, id)),
        },
        parseResponse: (response: Response) => {
          const { nodes } = response.data[manyLowerResourceName]
          return { data: nodes }
        },
      }
    case GET_MANY_REFERENCE:
      return getManyReference(
        params,
        type,
        manyLowerResourceName,
        resourceTypename,
        pluralizedResourceTypeName,
        typeMap,
        queryMap,
        allowedComplexTypes
      )
    case GET_LIST: {
      const { filter, sort } = params as ManyReferenceParams
      const orderBy =
        sort && sort.field && sort.order
          ? [createSortingKey(sort.field, sort.order)]
          : [NATURAL_SORTING]
      const filters = createFilter(filter, type)
      return {
        query: createGetListQuery(
          type,
          manyLowerResourceName,
          resourceTypename,
          pluralizedResourceTypeName,
          typeMap,
          queryMap,
          allowedComplexTypes,
          primaryKey
        ),
        variables: stripUndefined({
          offset: (params.pagination.page - 1) * params.pagination.perPage,
          first: params.pagination.perPage,
          filter: filters,
          orderBy,
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
            params.data,
            typeMap[`${resourceTypename}Input`],
            type,
            options.queryValueToInputValueMap
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
          ${createQueryFromType(resourceTypename, typeMap, allowedComplexTypes, primaryKey)}
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
            id: mapType(idType, params.id),
          },
        },
        query: gql`
          mutation ${deleteResourceName}($input: Delete${resourceTypename}Input!) {
            ${deleteResourceName}(input: $input) {
            ${singleLowerResourceName} {
            ${createQueryFromType(resourceTypename, typeMap, allowedComplexTypes, primaryKey)}
          }
          }
          }
        `,
        parseResponse: (response: Response) => ({
          data: response.data[`${deleteResourceName}`][singleLowerResourceName],
        }),
      }
    }
    case DELETE_MANY: {
      const thisIds = (params as UpdateManyParams).ids
      const deletions = thisIds.map((id) => ({
        id: mapType(idType, id),
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
              .map((id) => `$arg${escapeIdType(id)}: Delete${resourceTypename}Input!`)
              .join(',')}
            ) {
            ${params.ids.map(
              (id: string) => `
                k${escapeIdType(id)}:${deleteResourceName}(input: $arg${escapeIdType(id)}) {
                  clientMutationId
                }\n
                `
            )}
            }
        `,
        parseResponse: (response: Response) => ({
          data: params.ids.map((id: string) =>
            mapType(idType, response.data[`k${escapeIdType(id)}`].clientMutationId)
          ),
        }),
      }
    }
    case UPDATE: {
      const updateVariables = {
        input: {
          id: mapType(idType, params.id),
          patch: mapInputToVariables(
            params.data,
            typeMap[`${resourceTypename}Patch`],
            type,
            options.queryValueToInputValueMap
          ),
        },
      }
      return {
        variables: updateVariables,
        query: gql`
          mutation ${updateResourceName}($input: Update${resourceTypename}Input!) {
            ${updateResourceName}(input: $input) {
            ${singleLowerResourceName} {
            ${createQueryFromType(resourceTypename, typeMap, allowedComplexTypes, primaryKey)}
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
        id: mapType(idType, id),
        clientMutationId: id.toString(),
        patch: mapInputToVariables(
          data,
          typeMap[`${resourceTypename}Patch`],
          type,
          options.queryValueToInputValueMap
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
            mapType(idType, response.data[`update${escapeIdType(id)}`].clientMutationId)
          ),
        }),
      }
    }
    default:
      throw new Error(`${raFetchType} is not yet implemented.`)
  }
}
