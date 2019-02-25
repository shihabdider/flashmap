import React, { Component } from 'react'
import ReactPropTypes from 'prop-types'

import { observer } from 'mobx-react'
import { PropTypes as CommonPropTypes } from '../../../mst-types'
import { readConfObject } from '../../../configuration'
import { featureSpanPx, bpToPx } from '../../../util'

class Lollipop extends Component {
  static propTypes = {
    feature: ReactPropTypes.shape({ get: ReactPropTypes.func.isRequired })
      .isRequired,
    // horizontallyFlipped: ReactPropTypes.bool,
    // bpPerPx: ReactPropTypes.number.isRequired,
    // region: CommonPropTypes.Region.isRequired,
    // config: CommonPropTypes.ConfigSchema.isRequired,
    layoutRecord: ReactPropTypes.shape({
      x: ReactPropTypes.number.isRequired,
      y: ReactPropTypes.number.isRequired,
      width: ReactPropTypes.number.isRequired,
      height: ReactPropTypes.number.isRequired,
    }).isRequired,

    selectedFeatureId: ReactPropTypes.string,

    config: CommonPropTypes.ConfigSchema.isRequired,

    onFeatureMouseDown: ReactPropTypes.func,
    onFeatureMouseEnter: ReactPropTypes.func,
    onFeatureMouseOut: ReactPropTypes.func,
    onFeatureMouseOver: ReactPropTypes.func,
    onFeatureMouseUp: ReactPropTypes.func,
    onFeatureMouseLeave: ReactPropTypes.func,
    onFeatureMouseMove: ReactPropTypes.func,

    // synthesized from mouseup and mousedown
    onFeatureClick: ReactPropTypes.func,
  }

  static defaultProps = {
    // horizontallyFlipped: false,

    selectedFeatureId: undefined,

    onFeatureMouseDown: undefined,
    onFeatureMouseEnter: undefined,
    onFeatureMouseOut: undefined,
    onFeatureMouseOver: undefined,
    onFeatureMouseUp: undefined,
    onFeatureMouseLeave: undefined,
    onFeatureMouseMove: undefined,

    onFeatureClick: undefined,
  }

  static layout(args) {
    const { feature, bpPerPx, region, layout, horizontallyFlipped } = args

    const centerBp = Math.abs(feature.get('end') + feature.get('start')) / 2
    const centerPx = bpToPx(centerBp, region, bpPerPx, horizontallyFlipped)
    const radiusPx = readConfObject(args.config, 'radius', [feature])
    // const radiusBp = radiusPx * bpPerPx

    layout.add(feature.id(), centerPx, radiusPx * 2, radiusPx * 2, {
      featureId: feature.id(),
      centerX: centerPx,
      radiusPx,
    })
  }

  onFeatureMouseDown = event => {
    const { onFeatureMouseDown: handler, feature } = this.props
    if (!handler) return undefined
    return handler(event, feature.id())
  }

  onFeatureMouseEnter = event => {
    const { onFeatureMouseEnter: handler, feature } = this.props
    if (!handler) return undefined
    return handler(event, feature.id())
  }

  onFeatureMouseOut = event => {
    const { onFeatureMouseOut: handler, feature } = this.props
    if (!handler) return undefined
    return handler(event, feature.id())
  }

  onFeatureMouseOver = event => {
    const { onFeatureMouseOver: handler, feature } = this.props
    if (!handler) return undefined
    return handler(event, feature.id())
  }

  onFeatureMouseUp = event => {
    const { onFeatureMouseUp: handler, feature } = this.props
    if (!handler) return undefined
    return handler(event, feature.id())
  }

  onFeatureMouseLeave = event => {
    const { onFeatureMouseLeave: handler, feature } = this.props
    if (!handler) return undefined
    return handler(event, feature.id())
  }

  onFeatureMouseMove = event => {
    const { onFeatureMouseMove: handler, feature } = this.props
    if (!handler) return undefined
    return handler(event, feature.id())
  }

  onFeatureClick = event => {
    const { onFeatureClick: handler, feature } = this.props
    if (!handler) return undefined
    event.stopPropagation()
    return handler(event, feature.id())
  }

  render() {
    const {
      feature,
      config,
      layoutRecord: {
        x,
        y,
        width,
        height,
        data: { centerX, radiusPx },
      },
      selectedFeatureId,
    } = this.props

    const style = { fill: readConfObject(config, 'bodyColor', [feature]) }
    if (String(selectedFeatureId) === String(feature.id())) {
      style.fill = 'red'
    }

    return (
      <circle
        title={feature.id()}
        cx={centerX}
        cy={y + radiusPx}
        r={radiusPx}
        style={style}
        onMouseDown={this.onFeatureMouseDown}
        onMouseEnter={this.onFeatureMouseEnter}
        onMouseOut={this.onFeatureMouseOut}
        onMouseOver={this.onFeatureMouseOver}
        onMouseUp={this.onFeatureMouseUp}
        onMouseLeave={this.onFeatureMouseLeave}
        onMouseMove={this.onFeatureMouseMove}
        onClick={this.onFeatureClick}
        onFocus={this.onFeatureMouseOver}
        onBlur={this.onFeatureMouseOut}
      />
    )
  }
}

export default observer(Lollipop)