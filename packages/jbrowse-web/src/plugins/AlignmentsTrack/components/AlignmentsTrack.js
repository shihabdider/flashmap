import React, { Component } from 'react'
import { observer, PropTypes } from 'mobx-react'
import { hydrate, findDOMNode } from 'react-dom'

import TrackBlocks from '../../LinearGenomeView/components/TrackBlocks'

import './AlignmentsTrack.scss'

function LoadingMessage() {
  return <div className="loading">Loading ...</div>
}

function ErrorMessage({ error }) {
  return <div className="error">{error.message}</div>
}
ErrorMessage.propTypes = {
  error: PropTypes.objectOrObservableObject.isRequired,
}

@observer
class Block extends Component {
  static propTypes = {
    model: PropTypes.observableObject.isRequired,
  }

  componentDidMount() {
    this.doHydrate()
  }

  componentDidUpdate() {
    this.doHydrate()
  }

  doHydrate() {
    const { model } = this.props
    if (model.filled) {
      const { data, html, rendererType, renderProps } = model
      const domNode = findDOMNode(this) // eslint-disable-line react/no-find-dom-node
      domNode.innerHTML = html
      hydrate(
        <rendererType.ReactComponent data={data} renderProps={renderProps} />,
        domNode,
      )
    }
  }

  render() {
    const { model } = this.props
    if (model.error) return <ErrorMessage error={model.error} />
    if (!model.filled) return <LoadingMessage />
    return <div className="ssr-placeholder" />
  }
}

export const AlignmentsTrackBlock = Block

const AlignmentsTrack = observer(props => {
  const { blockState } = props.model
  return (
    <div className="AlignmentsTrack">
      <TrackBlocks {...props} blockState={blockState} />
    </div>
  )
})

AlignmentsTrack.propTypes = {
  model: PropTypes.observableObject.isRequired,
}

export default AlignmentsTrack
