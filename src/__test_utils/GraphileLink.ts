import {
  ApolloLink,
  Operation,
  NextLink,
  FetchResult,
  Observable,
  ExecutionResult,
} from 'apollo-link'
import { execute, getOperationAST, GraphQLSchema } from 'graphql'
import { Pool } from 'pg'
import { withPostGraphileContext } from 'postgraphile'

interface GraphileLinkInterface {
  pgPool: Pool
  schema: GraphQLSchema
}

export default class GraphileLink extends ApolloLink {
  constructor(private options: GraphileLinkInterface) {
    super()
  }

  request(
    operation: Operation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _forward?: NextLink
  ): Observable<FetchResult> | null {
    const { schema, pgPool } = this.options
    return new Observable<any>((observer) => {
      // eslint-disable-next-line no-extra-semi
      ;(async () => {
        try {
          const op = getOperationAST(operation.query, operation.operationName)
          /* Only do queries (not subscriptions)  */
          if (!op || op.operation !== 'query') {
            if (!observer.closed) {
              observer.complete()
            }
            return
          }

          const data = await withPostGraphileContext(
            { pgPool },
            (context) =>
              execute(
                schema,
                operation.query,
                {},
                context,
                operation.variables,
                operation.operationName
              ) as Promise<ExecutionResult>
          )
          if (!observer.closed) {
            observer.next(data)
            observer.complete()
          }
        } catch (e) {
          if (!observer.closed) {
            observer.error(e)
          } else {
            console.error(e)
          }
        }
      })()
    })
  }
}
