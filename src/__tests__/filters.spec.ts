/* tslint:disable:no-expression-statement */
import { mapFilterType } from '../filters'

describe('filters', () => {
  it('should filter by String', () => {
    expect(mapFilterType({ name: 'String' }, 'value', 'id')).toMatchSnapshot()
  })
  it('should filter by Int', () => {
    expect(mapFilterType({ name: 'Int' }, 5, 'id')).toMatchSnapshot()
  })
  it('should filter by BigInt', () => {
    expect(mapFilterType({ name: 'BigInt' }, 5, 'id')).toMatchSnapshot()
  })
  it('should filter by UUID', () => {
    expect(
      mapFilterType(
        { name: 'UUID' },
        '02d07429-c2a7-4494-aec9-e8bde9176e86',
        'id'
      )
    ).toMatchSnapshot()
  })
  it('should filter by boolean', () => {
    expect(
      mapFilterType({ name: 'Boolean' }, true, 'booleanField')
    ).toMatchSnapshot()
  })
  it('should throw on unsupported types', () => {
    expect(() =>
      mapFilterType({ name: 'Unsupported' }, 'foo', 'br')
    ).toThrowErrorMatchingSnapshot()
  })
})
