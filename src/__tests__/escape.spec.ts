/* tslint:disable:no-expression-statement */
import { escapeIdType } from '../utils'

describe('escape', () => {
  it('should escape UUIDs', () => {
    expect(escapeIdType('02d07429-c2a7-4494-aec9-e8bde9176e86')).toMatchSnapshot()
  })
})
