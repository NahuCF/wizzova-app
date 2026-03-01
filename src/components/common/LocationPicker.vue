<script setup lang="ts">
import { ref, watch, provide } from 'vue'
import { Map, Layers, Sources, Geometries } from 'vue3-openlayers'
import { toLonLat, fromLonLat } from 'ol/proj'
import type { Coordinate } from 'ol/coordinate'
import { MapBrowserEvent } from 'ol'
import { Style, Icon } from 'ol/style'
import mapPin from '~/assets/icons/map-pin.svg'

interface LatLng {
  lat: number
  lng: number
}

const props = defineProps({
  modelValue: { type: Object as () => LatLng | null, default: null },
  zoom: { type: Number, default: 12 },
  projection: { type: String, default: 'EPSG:3857' },
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: LatLng): void
  (e: 'locationSelected', val: { lat: number; lng: number; address: string }): void
}>()

provide('ol-options', { debug: false })

const selected = ref<LatLng | null>(props.modelValue)
const defaultCenter: Coordinate = fromLonLat([-58.3816, -34.6037])
const center = ref<Coordinate>(
  props.modelValue ? fromLonLat([props.modelValue.lng, props.modelValue.lat]) : defaultCenter,
)

const markerStyle = new Style({
  image: new Icon({
    src: mapPin,
    anchor: [0.5, 1],
    scale: 1.5,
  }),
})

watch(
  () => props.modelValue,
  (val) => {
    if (val) selected.value = val
    else {
      center.value = defaultCenter
      selected.value = null
    }
  },
  { immediate: true },
)

const reverseGeocode = async (lat: number, lng: number) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Geocode error')
    const data = await res.json()
    const addr = data.address || {}

    const street = [addr.house_number, addr.road || addr.pedestrian || addr.cycleway]
      .filter(Boolean)
      .join(' ')

    const parts = [
      street,
      addr.suburb || addr.neighbourhood || '',
      addr.city || addr.town || addr.village || '',
      addr.state || '',
      addr.country || '',
    ].filter(Boolean)

    return parts.join(', ')
  } catch {
    return ''
  }
}

const handleMapClick = async (event: MapBrowserEvent<any>) => {
  const [lng, lat] = toLonLat(event.coordinate)
  selected.value = { lat, lng }
  emit('update:modelValue', { lat, lng })

  const address = await reverseGeocode(lat, lng)
  emit('locationSelected', { lat, lng, address })
}
</script>

<template>
  <Map.OlMap class="w-full h-[400px]" @singleclick="handleMapClick">
    <Map.OlView :center="center" :zoom="zoom" :projection="projection" />
    <Layers.OlTileLayer>
      <Sources.OlSourceOSM />
    </Layers.OlTileLayer>

    <Layers.OlVectorLayer v-if="selected" :style="markerStyle">
      <Sources.OlSourceVector>
        <Map.OlFeature>
          <Geometries.OlGeomPoint :coordinates="fromLonLat([selected.lng, selected.lat])" />
        </Map.OlFeature>
      </Sources.OlSourceVector>
    </Layers.OlVectorLayer>
  </Map.OlMap>
</template>

<style scoped>
:deep(.ol-map) {
  height: 100%;
  width: 100%;
}
</style>
