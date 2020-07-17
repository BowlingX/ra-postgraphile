import expect from 'expect'
import { stripUndefined } from '../utils'

describe('utils', () => {
  it('should stripUndefined', () => {
    expect(stripUndefined({ x: undefined })).toEqual({})
  })
})
