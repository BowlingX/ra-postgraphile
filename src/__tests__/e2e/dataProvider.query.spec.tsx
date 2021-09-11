import expect from 'expect'
import { ApolloClient } from 'apollo-client'
import { convertLegacyDataProvider, DataProvider } from 'ra-core'
import { makeQueryRunner } from '../../__test_utils/QueryRunner'
import { factory } from '../../factory'

let client: ApolloClient<any>
let cleanup: () => void
let dataProvider: DataProvider

beforeAll(async () => {
  const { release, apolloClient, schema } = await makeQueryRunner()
  cleanup = release
  client = apolloClient
  const legacyProvider = await factory(client, undefined, { introspection: { schema } })
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
    const favoritesList = await dataProvider.getList('favoriteBook', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })
    expect(favoritesList).toMatchSnapshot()
  })

  it('should fetch a single item by nodeId', async () => {
    const favoritesList = await dataProvider.getList('favoriteBook', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })

    const singleBook = await dataProvider.getOne('favoriteBook', {
      id: favoritesList?.data[0]?.id,
    })
    expect(singleBook?.data?.isbn).toEqual('3221123')
  })

  it('should fetch many items by nodeId', async () => {
    const favoritesList = await dataProvider.getList('favoriteBook', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })

    const manyBooks = await dataProvider.getMany('favoriteBook', {
      ids: favoritesList?.data.map((data) => data.isbn),
    })
    console.log(manyBooks)
  })

  it('should be able to delete for non-id field primary keys with `deleteByNodeId`', async () => {
    const data = await dataProvider.getList('favoriteBook', {
      pagination: { perPage: 10, page: 1 },
      filter: {
        isbn: '3221123',
      },
      sort: { field: 'isbn', order: 'ASC' },
    })
    const deletedBook = await dataProvider.delete('favoriteBook', {
      id: data?.data[0].id,
      previousData: data?.data[0],
    })
    console.log(deletedBook)
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

    it('should use `$contains` to filter books', async () => {
      const books = await dataProvider.getList('book', {
        sort: { order: 'ASC', field: 'id' },
        filter: { $condition: { id: 1 } },
        pagination: { perPage: 10, page: 1 },
      })
      expect(books?.data?.length === 1)
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

    describe('Function', () => {
      it('should be able to fetch a resource by a `setof` function and custom type', async () => {
        expect(
          await dataProvider.getList('MyCustomBook', {
            sort: { field: 'id', order: 'ASC' },
            filter: {},
            pagination: { perPage: 10, page: 1 },
          })
        ).toMatchSnapshot()
      })
    })

    describe('Error resilience', () => {
      it('should fail on unknown resources', async () => {
        await expect(dataProvider.getOne('unknownResource', { id: 1 })).rejects.toEqual(
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

  describe('UUID type (#48)', () => {
    it('should list `Profile`', async () => {
      const result = await dataProvider.getList('profile', {
        sort: { order: 'asc', field: 'id' },
        filter: {},
        pagination: { perPage: 10, page: 1 },
      })
      expect(result.data[0]).toBeDefined()
      expect(result.data[0]?.name).toEqual('David')
    })
  })
})
