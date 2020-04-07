import gql from 'graphql-tag'
import pluralize, { singular } from 'pluralize'
import { createFilter } from './filters'
import { getManyReference } from './getManyReference'
import {
  capitalize,
  createGetListQuery,
  createGetManyQuery,
  createQueryFromType,
  createSortingKey,
  createTypeMap,
  lowercase,
  mapInputToVariables
} from './utils'

import {
  Factory,
  ManyReferenceParams,
  NATURAL_SORTING,
  QueryMap,
  Response,
  UpdateManyParams,
  VERB_CREATE,
  VERB_DELETE,
  VERB_DELETE_MANY,
  VERB_GET_LIST,
  VERB_GET_MANY,
  VERB_GET_MANY_REFERENCE,
  VERB_GET_ONE,
  VERB_UPDATE,
  VERB_UPDATE_MANY
} from './types'

// cache for all types
let typeMap: any
let queryMap: QueryMap

export const mapType = (idType: any, value: string | number) =>
  ['uuid', 'string'].includes(idType.name.toLowerCase())
    ? value
    : parseInt(value as string, 10)

export const buildQuery = (introspectionResults: any, factory: Factory) => (
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
    // tslint:disable-next-line:no-expression-statement
    queryMap = createTypeMap(queries)
  }
  if (!typeMap) {
    // tslint:disable-next-line:no-expression-statement
    typeMap = createTypeMap(types)
  }
  const type = typeMap[resourceTypename]
  const manyLowerResourceName = pluralize(lowercase(resourceTypename))
  const singleLowerResourceName = lowercase(resourceTypename)
  const idField = type.fields.find((thisType: any) => thisType.name === 'id')
  // tslint:disable-next-line:no-let
  let idType = idField.type
  if (!idType) {
    throw new Error('All types currently require an `id` field.')
  }
  if (idType.ofType) {
    // tslint:disable-next-line:no-expression-statement
    idType = idType.ofType
  }
  switch (raFetchType) {
    case VERB_GET_ONE:
      return {
        query: gql`query ${singleLowerResourceName}($id: ${idType.name}!) {
            ${singleLowerResourceName}(id: $id) {
            ${createQueryFromType(
              resourceTypename,
              typeMap,
              allowedComplexTypes
            )}
        }
        }`,
        variables: {
          id: mapType(idType, params.id)
        },
        parseResponse: (response: Response) => {
          return { data: response.data[singleLowerResourceName] }
        }
      }
    case VERB_GET_MANY:
      return {
        query: createGetManyQuery(
          type,
          manyLowerResourceName,
          resourceTypename,
          typeMap,
          queryMap,
          allowedComplexTypes,
          idType.name
        ),
        variables: {
          ids: params.ids
            .filter((v?: string) => typeof v !== 'undefined')
            .map((id: string | number) => mapType(idType, id))
        },
        parseResponse: (response: Response) => {
          const { nodes } = response.data[manyLowerResourceName]
          return { data: nodes }
        }
      }
    case VERB_GET_MANY_REFERENCE:
      return getManyReference(
        params,
        type,
        manyLowerResourceName,
        resourceTypename,
        typeMap,
        queryMap,
        allowedComplexTypes
      )
    case VERB_GET_LIST: {
      const { filter, sort } = params as ManyReferenceParams
      const orderBy = sort
        ? [createSortingKey(sort.field, sort.order)]
        : [NATURAL_SORTING]
      const filters = createFilter(filter, type)
      return {
        query: createGetListQuery(
          type,
          manyLowerResourceName,
          resourceTypename,
          typeMap,
          queryMap,
          allowedComplexTypes
        ),
        variables: {
          offset: (params.pagination.page - 1) * params.pagination.perPage,
          first: params.pagination.perPage,
          filter: filters,
          orderBy
        },
        parseResponse: (response: Response) => {
          const { nodes, totalCount } = response.data[manyLowerResourceName]
          return { data: nodes, total: totalCount }
        }
      }
    }
    case VERB_CREATE: {
      const variables = {
        input: {
          [singleLowerResourceName]: mapInputToVariables(
            params.data,
            typeMap[`${resourceTypename}Input`],
            type,
            options.queryValueToInputValueMap
          )
        }
      }
      return {
        variables,
        query: gql`mutation create${resourceTypename}($input: Create${resourceTypename}Input!) {
          create${resourceTypename} (
          input: $input
        ) {
          ${singleLowerResourceName} {
          ${createQueryFromType(resourceTypename, typeMap, allowedComplexTypes)}
        }
        }
        }`,
        parseResponse: (response: Response) => ({
          data:
            response.data[`create${resourceTypename}`][singleLowerResourceName]
        })
      }
    }
    case VERB_DELETE: {
      return {
        variables: {
          input: {
            id: mapType(idType, params.id)
          }
        },
        query: gql`
          mutation delete${resourceTypename}($input: Delete${resourceTypename}Input!) {
            delete${resourceTypename}(input: $input) {
            ${singleLowerResourceName} {
            ${createQueryFromType(
              resourceTypename,
              typeMap,
              allowedComplexTypes
            )}
          }
          }
          }
        `,
        parseResponse: (response: Response) => ({
          data:
            response.data[`delete${resourceTypename}`][singleLowerResourceName]
        })
      }
    }
    case VERB_DELETE_MANY: {
      const thisIds = (params as UpdateManyParams).ids
      const deletions = thisIds.map(id => ({
        id: mapType(idType, id),
        clientMutationId: id.toString()
      }))
      return {
        variables: deletions.reduce(
          (next, input) => ({
            [`arg${input.id}`]: input,
            ...next
          }),
          {}
        ),
        query: gql`
            mutation deleteMany${resourceTypename}(
            ${thisIds
              .map(id => `$arg${id}: Delete${resourceTypename}Input!`)
              .join(',')}
            ) {
            ${params.ids.map(
              (id: string) => `
                k${id}:delete${resourceTypename}(input: $arg${id}) {
                  clientMutationId
                }\n
                `
            )}
            }
        `,
        parseResponse: (response: Response) => ({
          data: params.ids.map((id: string) =>
            mapType(idType, response.data[`k${id}`].clientMutationId)
          )
        })
      }
    }
    case VERB_UPDATE: {
      const updateVariables = {
        input: {
          id: mapType(idType, params.id),
          patch: mapInputToVariables(
            params.data,
            typeMap[`${resourceTypename}Patch`],
            type,
            options.queryValueToInputValueMap
          )
        }
      }
      return {
        variables: updateVariables,
        query: gql`
          mutation update${resourceTypename}($input: Update${resourceTypename}Input!) {
            update${resourceTypename}(input: $input) {
            ${singleLowerResourceName} {
            ${createQueryFromType(
              resourceTypename,
              typeMap,
              allowedComplexTypes
            )}
          }
          }
          }
        `,
        parseResponse: (response: Response) => ({
          data:
            response.data[`update${resourceTypename}`][singleLowerResourceName]
        })
      }
    }
    case VERB_UPDATE_MANY: {
      const { ids, data } = params as UpdateManyParams
      const inputs = ids.map(id => ({
        id: mapType(idType, id),
        clientMutationId: id.toString(),
        patch: mapInputToVariables(
          data,
          typeMap[`${resourceTypename}Patch`],
          type,
          options.queryValueToInputValueMap
        )
      }))
      return {
        variables: inputs.reduce(
          (next, input) => ({
            [`arg${input.id}`]: input,
            ...next
          }),
          {}
        ),
        query: gql`mutation updateMany${resourceTypename}(
        ${ids
          .map(id => `$arg${id}: Update${resourceTypename}Input!`)
          .join(',')}) {
          ${inputs.map(input => {
            return `
             update${input.id}:update${resourceTypename}(input: $arg${input.id}) {
               clientMutationId
             }
            `
          })}
        }`,
        parseResponse: (response: Response) => ({
          data: ids.map(id =>
            mapType(idType, response.data[`update${id}`].clientMutationId)
          )
        })
      }
    }
    default:
      throw new Error(`${raFetchType} is not yet implemented.`)
  }
}
