// @flow

export type QueryInputTypeMapper = { [string]: (value: Object) => Object }

export type ProviderOptions = {
  /** It's possible that a type has a different shape when a Query is used then when the Input/Patch is used*/
  queryValueToInputValueMap: QueryInputTypeMapper
}

export type Factory = {
  options: ProviderOptions
}

export type SortDirection = 'ASC' | 'DESC'

export type UpdateManyParams = {
  ids: Array<number | string>,
  data: Object
}

export type ManyReferenceParams = {
  filter: Object,
  sort: { field: string, order: SortDirection },
  target: string,
  id: number,
  pagination: { page: number, perPage: number }
}

export type Response = {
  data: Object
}

// Constants

export const NODE_INTERFACE = 'Node'

export const CAMEL_REGEX = /(.+?)([A-Z])/gm

export const NATURAL_SORTING = 'NATURAL'

export const VERB_GET_ONE = 'GET_ONE'
export const VERB_GET_MANY = 'GET_MANY'
export const VERB_GET_MANY_REFERENCE = 'GET_MANY_REFERENCE'
export const VERB_GET_LIST = 'GET_LIST'
export const VERB_CREATE = 'CREATE'
export const VERB_DELETE = 'DELETE'
export const VERB_DELETE_MANY = 'DELETE_MANY'
export const VERB_UPDATE = 'UPDATE'
export const VERB_UPDATE_MANY = 'UPDATE_MANY'
