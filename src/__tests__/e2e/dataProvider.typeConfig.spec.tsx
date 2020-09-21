import expect from 'expect'
import { ApolloClient } from 'apollo-client'
import { convertLegacyDataProvider, DataProvider, GET_LIST } from 'ra-core'
import { makeQueryRunner } from '../../__test_utils/QueryRunner'
import { factory } from '../../factory'
import { FetchQueryType, ProviderOptions } from '../../types'

let client: ApolloClient<any>
let cleanup: () => void
let dataProvider: DataProvider

const extendedConfiguration: ProviderOptions = {
  typeMap: {
    Book: {
      excludeFields: (fieldName: string, queryType: FetchQueryType) => {
        return fieldName === 'isbn' && queryType === GET_LIST
      },
      computeArgumentsForField: (fieldName) => {
        if (fieldName === 'greet') {
          return { greeting: 'Hello :)' }
        }
        return null
      },
    },
    Author: {
      includeFields: ['id'],
    },
    ComplexType: {
      expand: true,
    },
    AnotherType: {
      expand: true,
    },
  },
}

beforeAll(async () => {
  const { release, apolloClient, schema } = await makeQueryRunner()
  cleanup = release
  client = apolloClient
  const legacyProvider = await factory(client, extendedConfiguration, { introspection: { schema } })
  dataProvider = convertLegacyDataProvider(legacyProvider)
})

afterAll(() => {
  cleanup()
})

describe('Extended type configuration', () => {
  it('Book should exclude certain fields as defined', async () => {
    const bookList = await dataProvider.getList('Book', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })
    expect(bookList.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ isbn: expect.anything() })])
    )
  })
  it('Book should query `greet` with arguments and complex types should be expanded', async () => {
    const bookList = await dataProvider.getList('Book', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })
    expect(bookList.data).toMatchSnapshot()
  })
  it('Author list should only return its id', async () => {
    const authors = await dataProvider.getList('Author', {
      sort: { field: 'id', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })
    expect(authors.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: expect.anything() })])
    )
  })
})
