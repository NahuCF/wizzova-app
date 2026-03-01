<script setup lang="ts">
import { provide, computed } from 'vue'
import { Map, Layers, Sources, Geometries } from 'vue3-openlayers'
import { fromLonLat } from 'ol/proj'
import { Style, Icon } from 'ol/style'
import mapPin from '~/assets/icons/map-pin.svg'

interface LatLng {
  lat: number
  lng: number
}

const props = defineProps<{ location: LatLng | null }>()

provide('ol-options', { debug: false })

const markerStyle = new Style({
  image: new Icon({
    src: mapPin,
    anchor: [0.5, 1],
    scale: 1.2,
  }),
})

const center = computed(() =>
  props.location ? fromLonLat([props.location.lng, props.location.lat]) : fromLonLat([0, 0]),
)
</script>

<template>
  <Map.OlMap style="width: 100%; height: 150px" :interactions="[]" :controls="[]">
    <Map.OlView :center="center" :zoom="14" projection="EPSG:3857" />

    <Layers.OlTileLayer>
      <Sources.OlSourceOSM />
    </Layers.OlTileLayer>

    <Layers.OlVectorLayer v-if="props.location" :style="markerStyle">
      <Sources.OlSourceVector>
        <Map.OlFeature>
          <Geometries.OlGeomPoint
            :coordinates="fromLonLat([props.location.lng, props.location.lat])"
          />
        </Map.OlFeature>
      </Sources.OlSourceVector>
    </Layers.OlVectorLayer>
  </Map.OlMap>
</template>

<style scoped>
:deep(.ol-map) {
  width: 100%;
  height: 150px;
}
</style>
