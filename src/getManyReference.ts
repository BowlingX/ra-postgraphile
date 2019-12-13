import { createFilter } from './filters'
import { ManyReferenceParams, NATURAL_SORTING, Response } from './types'
import { createGetListQuery, createSortingKey } from './utils'

export const getManyReference = (
  params: ManyReferenceParams,
  type: object,
  manyLowerResourceName: string,
  resourceTypename: string,
  typeMap: object,
  allowedTypes: string[]
) => {
  const { filter, sort, target, id, pagination } = params
  const orderBy = sort
    ? [createSortingKey(sort.field, sort.order)]
    : [NATURAL_SORTING]
  const filters = createFilter({ [target]: id, ...filter }, type)
  return {
    query: createGetListQuery(
      type,
      manyLowerResourceName,
      resourceTypename,
      typeMap,
      allowedTypes
    ),
    variables: {
      offset: (pagination.page - 1) * pagination.perPage,
      first: pagination.perPage,
      filter: filters,
      orderBy
    },
    parseResponse: (response: Response) => {
      const { nodes, totalCount } = response.data[manyLowerResourceName]
      return {
        data: nodes,
        total: totalCount
      }
    }
  }
}
