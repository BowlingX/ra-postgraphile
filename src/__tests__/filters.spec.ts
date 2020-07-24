/* tslint:disable:no-expression-statement */
import type { IntrospectionNamedTypeRef } from 'graphql'
import { mapFilterType } from '../filters'

describe('filters', () => {
  it('should filter by String', () => {
    expect(
      mapFilterType({ name: 'String' } as IntrospectionNamedTypeRef, 'value', 'id')
    ).toMatchSnapshot()
  })
  it('should filter by Int', () => {
    expect(mapFilterType({ name: 'Int' } as IntrospectionNamedTypeRef, 5, 'id')).toMatchSnapshot()
  })
  it('should filter by BigInt', () => {
    expect(
      mapFilterType({ name: 'BigInt' } as IntrospectionNamedTypeRef, 5, 'id')
    ).toMatchSnapshot()
  })
  it('should filter by UUID', () => {
    expect(
      mapFilterType(
        { name: 'UUID' } as IntrospectionNamedTypeRef,
        '02d07429-c2a7-4494-aec9-e8bde9176e86',
        'id'
      )
    ).toMatchSnapshot()
  })
  it('should filter by boolean', () => {
    expect(
      mapFilterType({ name: 'Boolean' } as IntrospectionNamedTypeRef, true, 'booleanField')
    ).toMatchSnapshot()
  })
  it('should throw on unsupported types', () => {
    expect(() =>
      mapFilterType({ name: 'Unsupported' } as IntrospectionNamedTypeRef, 'foo', 'br')
    ).toThrowErrorMatchingSnapshot()
  })
})
