import { IntrospectionType } from 'graphql'
import type { GetManyReferenceParams } from 'ra-core'
import { createFilter } from './filters'
import { NATURAL_SORTING, QueryMap, Response, SortDirection, TypeConfigMap, TypeMap } from './types'
import { createGetListQuery, createSortingKey, PrimaryKey } from './utils'

export const getManyReference = (
  params: GetManyReferenceParams,
  type: IntrospectionType,
  manyLowerResourceName: string,
  resourceTypename: string,
  pluralizedResourceTypeName: string,
  typeMap: TypeMap,
  queryMap: QueryMap,
  typeConfiguration: TypeConfigMap,
  primaryKey: PrimaryKey
) => {
  const { filter, sort, target, id, pagination } = params
  const orderBy = sort
    ? [createSortingKey(sort.field, sort.order as SortDirection)]
    : [NATURAL_SORTING]
  const filters = createFilter({ [target]: id, ...filter }, type)
  return {
    query: createGetListQuery(
      type,
      manyLowerResourceName,
      resourceTypename,
      pluralizedResourceTypeName,
      typeMap,
      queryMap,
      typeConfiguration,
      primaryKey
    ),
    variables: {
      offset: (pagination.page - 1) * pagination.perPage,
      first: pagination.perPage,
      filter: filters,
      orderBy,
    },
    parseResponse: (response: Response) => {
      const { nodes, totalCount } = response.data[manyLowerResourceName]
      return {
        data: nodes,
        total: totalCount,
      }
    },
  }
}
