import { TypeConfigMap } from './types'

interface GeoJSON {
  coordinates: number[]
}

export const buildInTypeConfig: TypeConfigMap = {
  GeometryPoint: {
    expand: true,
    queryValueToInputValue: (value: { geojson: GeoJSON; type: string }) => value.geojson,
  },
  GeometryGeometry: {
    expand: true,
    queryValueToInputValue: (value: { geojson: GeoJSON; type: string }) => value.geojson,
  },
  GeographyPoint: {
    expand: true,
    queryValueToInputValue: (value: { geojson: GeoJSON; type: string }) => value.geojson,
  },
}
