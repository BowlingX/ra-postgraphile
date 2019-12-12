export const defaultQueryValueToInputValueMap = {
  GeometryPoint: (value: {
    geojson: { coordinates: Array<number> }
    type: string
  }) => value.geojson,
  GeometryGeometry: (value: {
    geojson: { coordinates: Array<number> }
    type: string
  }) => value.geojson,
  GeographyPoint: (value: {
    geojson: { coordinates: Array<number> }
    type: string
  }) => value.geojson
}
