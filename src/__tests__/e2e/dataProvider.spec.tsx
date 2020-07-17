import expect from 'expect'
import { ApolloClient } from 'apollo-client'
import { introspectionFromSchema, IntrospectionQuery } from 'graphql'
import { convertLegacyDataProvider, DataProvider } from 'ra-core'
import { makeQueryRunner } from '../../__test_utils/QueryRunner'
import { factory } from '../../factory'

let client: ApolloClient<any>
let cleanup: () => void
let introspection: IntrospectionQuery
let dataProvider: DataProvider

beforeAll(async () => {
  const { schema, release, apolloClient } = await makeQueryRunner()
  cleanup = release
  client = apolloClient
  introspection = introspectionFromSchema(schema, { descriptions: true })
  const legacyProvider = await factory(
    client,
    { queryValueToInputValueMap: {} },
    { introspection: introspection.__schema }
  )
  dataProvider = convertLegacyDataProvider(legacyProvider)
})

afterAll(() => {
  cleanup()
})

describe('dataProvider', () => {
  it('should construct from a schema', async () => {
    expect(dataProvider).toBeDefined()
  })
})

describe('Primary keys', () => {
  it('should handle non-id field primary keys with `nodeId`', async () => {
    expect(
      await dataProvider.getList('favoriteBook', {
        sort: { field: 'isbn', order: 'ASC' },
        filter: {},
        pagination: { perPage: 10, page: 1 },
      })
    ).toMatchSnapshot()
  })
})

describe('Query Types', () => {
  describe('should getOne', () => {
    it('should find a book', async () => {
      expect(await dataProvider.getOne('book', { id: 1 })).toMatchSnapshot()
    })
    it('should return null if book was not found', async () => {
      expect(await dataProvider.getOne('book', { id: 5 })).toMatchSnapshot()
    })
  })

  describe('should getList', () => {
    it('should list all books without filter and sorting', async () => {
      expect(
        await dataProvider.getList('book', {
          // @ts-ignore
          sort: {},
          filter: {},
          pagination: { perPage: 10, page: 1 },
        })
      ).toMatchSnapshot()
    })

    it('should list all books with sorting', async () => {
      expect(
        await dataProvider.getList('book', {
          sort: { field: 'id', order: 'ASC' },
          filter: {},
          pagination: { perPage: 10, page: 1 },
        })
      ).toMatchSnapshot()
    })

    it('should filter books', async () => {
      expect(
        await dataProvider.getList('book', {
          sort: { order: 'ASC', field: 'id' },
          filter: { id: 1 },
          pagination: { perPage: 10, page: 1 },
        })
      ).toMatchSnapshot()
    })

    describe('View', () => {
      it('should work with views', async () => {
        expect(
          await dataProvider.getList('allFavoriteBooks', {
            sort: { field: 'id', order: 'ASC' },
            filter: {},
            pagination: { perPage: 10, page: 1 },
          })
        ).toMatchSnapshot()
      })
    })

    describe('Error resilience', () => {
      it('should fail on unknown resources', () => {
        expect(() => dataProvider.getOne('unknownResource', { id: 1 })).toThrow(
          Error('Type "UnknownResource" did not exist in the introspection result.')
        )
      })

      it('should allow lowercase fields to sort on', async () => {
        expect(
          await dataProvider.getList('book', {
            sort: { order: 'asc', field: 'id' },
            filter: {},
            pagination: { perPage: 10, page: 1 },
          })
        ).toMatchSnapshot()
      })

      it('should work on uppercase resource names', async () => {
        expect(await dataProvider.getOne('Book', { id: 1 })).toMatchSnapshot()
      })
    })
  })
})
