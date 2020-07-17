import type { IntrospectionNamedTypeRef } from 'graphql'
import { mapType } from '../buildQuery'

describe('buildQuery', () => {
  it('mapType should map types', () => {
    expect(mapType(({ name: 'UUID' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual('1')
    expect(mapType(({ name: 'String' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual('1')
    expect(mapType(({ name: 'Uuid' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual('1')
    expect(mapType(({ name: 'BigInt' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual(1)
    expect(mapType(({ name: 'Int' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual(1)
  })
})
