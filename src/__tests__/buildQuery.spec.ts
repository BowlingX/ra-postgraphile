import { mapType } from '../buildQuery'

describe('buildQuery', () => {
  it('mapType should map types', () => {
    expect(mapType({ name: 'UUID' }, '1')).toEqual('1')
    expect(mapType({ name: 'String' }, '1')).toEqual('1')
    expect(mapType({ name: 'Uuid' }, '1')).toEqual('1')
    expect(mapType({ name: 'BigInt' }, '1')).toEqual(1)
    expect(mapType({ name: 'Int' }, '1')).toEqual(1)
  })
})
