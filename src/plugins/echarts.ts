import type { App } from 'vue'
import * as echarts from 'echarts/core'
import VueECharts from 'vue-echarts'

// Charts
import { LineChart } from 'echarts/charts'

import { TooltipComponent, GridComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, TooltipComponent, GridComponent, LegendComponent, TitleComponent, CanvasRenderer])

export default {
  install(app: App) {
    app.component('VueECharts', VueECharts)
  }
}
