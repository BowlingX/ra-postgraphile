/* tslint:disable:no-expression-statement */
import type { FilterSpec } from '../types'
import { mapFilterType } from '../filters'

describe('filters', () => {
  it('should filter by String', () => {
    expect(mapFilterType({ kind: 'SCALAR', name: 'String' }, 'value', 'id')).toMatchSnapshot()
  })
  it('should filter using a FilterSpec', () => {
    const spec: FilterSpec = {
      operator: 'likeInsensitive',
      value: 'ilike value',
    }

    expect(mapFilterType({ kind: 'SCALAR', name: 'String' }, spec, 'id')).toMatchSnapshot()
  })
  it('should filter by Int', () => {
    expect(mapFilterType({ kind: 'SCALAR', name: 'Int' }, 5, 'id')).toMatchSnapshot()
  })
  it('should filter by BigInt', () => {
    expect(mapFilterType({ kind: 'SCALAR', name: 'Int' }, 5, 'id')).toMatchSnapshot()
  })
  it('should filter by UUID', () => {
    expect(
      mapFilterType({ kind: 'SCALAR', name: 'UUID' }, '02d07429-c2a7-4494-aec9-e8bde9176e86', 'id')
    ).toMatchSnapshot()
  })
  it('should filter by boolean', () => {
    expect(
      mapFilterType({ kind: 'SCALAR', name: 'Boolean' }, true, 'booleanField')
    ).toMatchSnapshot()
  })
  it('should filter with Full Text', () => {
    expect(mapFilterType({ kind: 'SCALAR', name: 'FullText' }, 'test', 'id')).toMatchSnapshot()
  })
  it('should support custom filters via objects', () => {
    const spec: FilterSpec = {
      operator: 'contains',
      value: ['a', 'b'],
    }
    expect(mapFilterType({ kind: 'SCALAR', name: 'String' }, spec, 'id')).toMatchSnapshot()
  })
  it('should support a value of undefined', () => {
    expect(mapFilterType({ kind: 'SCALAR', name: 'String' }, undefined, 'id')).toMatchSnapshot()
  })
  it('should support custom filters with a value of undefined', () => {
    const spec: FilterSpec = {
      operator: 'contains',
      value: undefined,
    }
    expect(mapFilterType({ kind: 'SCALAR', name: 'String' }, spec, 'id')).toMatchSnapshot()
  })
  it('should throw an error if custom filter is not of type FilterSpec', () => {
    expect(() =>
      mapFilterType({ kind: 'SCALAR', name: 'String' }, {}, 'id')
    ).toThrowErrorMatchingSnapshot()

    expect(() =>
      mapFilterType({ kind: 'SCALAR', name: 'String' }, { operator: undefined, value: 'foo' }, 'id')
    ).toThrowErrorMatchingSnapshot()
  })
})
