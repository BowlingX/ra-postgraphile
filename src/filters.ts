export const mapFilterType = (type: any, value: any) => {
  switch (type.name) {
    case 'String':
      return {
        like: `%${value}%`
      }
    case 'Int':
      return Array.isArray(value)
        ? {
            in: value
          }
        : {
            equalTo: value
          }
    default:
      throw new Error(`Filter for type ${type.name} not implemented.`)
  }
}

export const createFilter = (fields: any, type: any) => {
  const empty = {}
  const filters = Object.keys(fields).reduce((next, key) => {
    const maybeType = type.fields.find(f => f.name === key)
    if (maybeType) {
      const type = maybeType.type.ofType || maybeType.type
      return {
        ...next,
        [key]: mapFilterType(type, fields[key])
      }
    }
    return next
  }, empty)
  if (filters === empty) {
    return undefined
  }
  return { and: [filters] }
}
