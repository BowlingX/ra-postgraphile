import type { IntrospectionNamedTypeRef } from 'graphql'
import { mapType } from '../buildQuery'

describe('buildQuery', () => {
  it('mapType should map types', () => {
    expect(mapType(({ name: 'UUID' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual('1')
    expect(mapType(({ name: 'String' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual('1')
    expect(mapType(({ name: 'Uuid' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual('1')
    expect(mapType(({ name: 'BigInt' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual(1)
    expect(mapType(({ name: 'Int' } as any) as IntrospectionNamedTypeRef<any>, '1')).toEqual(1)
    expect(
      mapType(({ name: 'IntParseable' } as any) as IntrospectionNamedTypeRef<any>, '1234')
    ).toEqual(1234)
    expect(
      mapType(({ name: 'Unmapped' } as any) as IntrospectionNamedTypeRef<any>, 'stringValue')
    ).toEqual('stringValue')
    expect(
      mapType(({ name: 'Mapped' } as any) as IntrospectionNamedTypeRef<any>, '****', {
        Mapped: {
          queryValueToInputValue: (a) => a.charCodeAt(0),
        },
      })
    ).toEqual(42)
  })
})
