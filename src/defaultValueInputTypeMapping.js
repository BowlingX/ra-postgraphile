// @flow

export const defaultQueryValueToInputValueMap = {
  GeographyPoint: (value: {
    geojson: { coordinates: Array<number> },
    type: string
  }) => value.geojson
}
