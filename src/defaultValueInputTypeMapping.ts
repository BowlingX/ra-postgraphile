export const defaultQueryValueToInputValueMap = {
  GeometryPoint: (value: {
    geojson: { coordinates: number[] }
    type: string
  }) => value.geojson,
  GeometryGeometry: (value: {
    geojson: { coordinates: number[] }
    type: string
  }) => value.geojson,
  GeographyPoint: (value: {
    geojson: { coordinates: number[] }
    type: string
  }) => value.geojson,
}
