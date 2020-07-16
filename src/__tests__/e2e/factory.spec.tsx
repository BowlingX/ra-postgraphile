import expect from 'expect'
import { ApolloClient } from 'apollo-client'
import { introspectionFromSchema, IntrospectionQuery } from 'graphql'
import { convertLegacyDataProvider } from 'ra-core'
import { makeQueryRunner } from '../../__test_utils/QueryRunner'
import { factory } from '../../factory'

let client: ApolloClient<any>
let cleanup: () => void
let introspection: IntrospectionQuery

beforeAll(async () => {
  const { schema, release, apolloClient } = await makeQueryRunner()
  cleanup = release
  client = apolloClient
  introspection = introspectionFromSchema(schema, { descriptions: true })
})

afterAll(() => {
  cleanup()
})

describe('factory', () => {
  it('should construct from a schema', async () => {
    const legacyProvider = await factory(
      client,
      { queryValueToInputValueMap: {} },
      { introspection: introspection.__schema }
    )
    const dataProvider = convertLegacyDataProvider(legacyProvider)

    const result = await dataProvider.getList('books', {
      pagination: { page: 1, perPage: 10 },
      filter: {},
      sort: { field: 'id', order: 'ASC' },
    })
    expect(result.data).toMatchSnapshot()
  })
})
