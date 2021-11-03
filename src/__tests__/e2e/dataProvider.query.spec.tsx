import expect from 'expect'
import { ApolloClient } from '@apollo/client'
import { DataProvider } from 'ra-core'
import { makeQueryRunner } from '../../__test_utils/QueryRunner'
import { factory } from '../../factory'

let client: ApolloClient<any>
let cleanup: () => void
let dataProvider: DataProvider

beforeAll(async () => {
  const { release, apolloClient, schema } = await makeQueryRunner()
  cleanup = release
  client = apolloClient
  dataProvider = await factory(client, undefined, { introspection: { schema, operationNames: {} } })
})

beforeEach(async () => {
  await client.clearStore()
})

afterAll(() => {
  cleanup()
})

describe('dataProvider', () => {
  it('should construct from a schema', async () => {
    expect(dataProvider).toBeDefined()
  })
})

describe('Non standard Primary keys', () => {
  it('should list them', async () => {
    const favoritesList = await dataProvider.getList('favoriteBook', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })
    expect(favoritesList).toMatchSnapshot()
  })

  it('should fetch a single item', async () => {
    const singleBook = await dataProvider.getOne('favoriteBook', {
      id: '3221123',
    })
    expect(singleBook?.data?.isbn).toEqual('3221123')
  })

  it('should fetch many items', async () => {
    const manyBooks = await dataProvider.getMany('favoriteBook', {
      ids: ['51231', '3221123'],
    })
    expect(manyBooks).toMatchSnapshot()
  })

  it('should be able to delete`', async () => {
    const result = await dataProvider.delete('favoriteBook', {
      id: '3221123',
      previousData: { id: '3221123' },
    })
    expect(result).toMatchSnapshot()
    const singleBook = await dataProvider.getOne('favoriteBook', {
      id: '3221123',
    })
    expect(singleBook.data).toBeNull()
    await dataProvider.create('favoriteBook', {
      data: {
        isbn: '3221123',
      },
    })
  })

  it('should be able to delete many', async () => {
    await dataProvider.deleteMany('favoriteBook', {
      ids: ['3221123', '51231'],
    })
    const favoritesList = await dataProvider.getList('favoriteBook', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })
    expect(favoritesList.total).toEqual(0)
    await dataProvider.create('favoriteBook', {
      data: {
        isbn: '3221123',
      },
    })
    await dataProvider.create('favoriteBook', {
      data: {
        isbn: '51231',
      },
    })
  })
  it('should able to update', async () => {
    await dataProvider.update('favoriteBook', {
      id: '3221123',
      data: {
        isbn: 'XYZ',
      },
      previousData: {
        id: '3221123',
        isbn: '3221123',
      },
    })
    const singleBook = await dataProvider.getOne('favoriteBook', {
      id: 'XYZ',
    })
    expect(singleBook.data?.isbn).toEqual('XYZ')
    await dataProvider.update('favoriteBook', {
      id: 'XYZ',
      data: {
        isbn: '3221123',
      },
      previousData: {
        id: 'XYZ',
        isbn: 'XYZ',
      },
    })
  })
  it('should be able to update many', async () => {
    const result = await dataProvider.updateMany('favoriteBook', {
      ids: ['3221123', '51231'],
      data: {
        isSuperFavorite: true,
      },
    })
    expect(result).toMatchSnapshot()
    const favoritesList = await dataProvider.getList('favoriteBook', {
      sort: { field: 'isbn', order: 'ASC' },
      filter: {},
      pagination: { perPage: 10, page: 1 },
    })
    expect(favoritesList).toMatchSnapshot()
    await dataProvider.updateMany('favoriteBook', {
      ids: ['3221123', '51231'],
      data: {
        isSuperFavorite: false,
      },
    })
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
