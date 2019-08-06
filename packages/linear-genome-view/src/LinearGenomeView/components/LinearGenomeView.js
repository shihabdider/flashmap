import {
  Icon,
  Select,
  IconButton,
  InputBase,
  Typography,
  TextField,
  Paper,
  Menu,
  MenuItem,
  makeStyles,
} from '@material-ui/core'
import { clamp, getSession } from '@gmod/jbrowse-core/util'

import classnames from 'classnames'
import { observer, PropTypes } from 'mobx-react'
import ReactPropTypes from 'prop-types'
import React, { useState } from 'react'

import buttonStyles from './buttonStyles'
import ZoomControls from './ZoomControls'
import TrackResizeHandle from './TrackResizeHandle'
import TrackRenderingContainer from './TrackRenderingContainer'
import Rubberband from './Rubberband'
import ScaleBar from './ScaleBar'

const dragHandleHeight = 3

const useStyles = makeStyles(theme => ({
  root: {
    position: 'relative',
    marginBottom: theme.spacing(1),
    overflow: 'hidden',
  },
  linearGenomeView: {
    background: '#eee',
    // background: theme.palette.background.paper,
    boxSizing: 'content-box',
  },
  controls: {
    borderRight: '1px solid gray',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  viewControls: {
    height: '100%',
    borderBottom: '1px solid #9e9e9e',
    boxSizing: 'border-box',
  },
  trackControls: {
    whiteSpace: 'normal',
  },
  headerBar: {
    gridArea: '1/1/auto/span 2',
    display: 'flex',
  },
  spacer: {
    flexGrow: 1,
  },
  navbox: {
    margin: theme.spacing(1),
  },
  emphasis: {
    background: '#dddd',
    padding: theme.spacing(1),
  },
  searchRoot: {
    margin: theme.spacing(1),
    alignItems: 'center',
  },
  viewName: {
    margin: theme.spacing(0.25),
  },
  zoomControls: {
    position: 'absolute',
    top: 0,
  },
  ...buttonStyles(theme),
}))

const TrackContainer = observer(({ model, track }) => {
  const classes = useStyles()
  const { bpPerPx, offsetPx } = model
  const [scrollTop, setScrollTop] = useState(0)
  const session = getSession(model)
  return (
    <>
      <div
        className={classnames(classes.controls, classes.trackControls)}
        key={`controls:${track.id}`}
        style={{ gridRow: `track-${track.id}`, gridColumn: 'controls' }}
      >
        <track.ControlsComponent
          track={track}
          key={track.id}
          view={model}
          onConfigureClick={track.activateConfigurationUI}
        />
      </div>
      <TrackRenderingContainer
        key={`track-rendering:${track.id}`}
        trackId={track.id}
        height={track.height}
        scrollTop={scrollTop}
        onHorizontalScroll={model.horizontalScroll}
        onVerticalScroll={(value, max) => {
          const n = scrollTop + value
          if (n > 0 && n < max) {
            session.shouldntScroll = true
          } else {
            session.shouldntScroll = false
          }
          setScrollTop(clamp(n, 0, max))
        }}
      >
        <track.RenderingComponent
          model={track}
          offsetPx={offsetPx}
          bpPerPx={bpPerPx}
          blockState={{}}
          onHorizontalScroll={model.horizontalScroll}
        />
      </TrackRenderingContainer>
      <TrackResizeHandle
        key={`handle:${track.id}`}
        trackId={track.id}
        onVerticalDrag={model.resizeTrack}
      />
    </>
  )
})
TrackContainer.propTypes = {
  model: PropTypes.objectOrObservableObject.isRequired,
  track: ReactPropTypes.shape({}).isRequired,
}

const ITEM_HEIGHT = 48

function LongMenu(props) {
  const { className } = props
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)

  const { options } = props

  function handleClick(event) {
    setAnchorEl(event.currentTarget)
  }

  function handleClose() {
    setAnchorEl(null)
  }

  return (
    <>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        className={className}
        onClick={handleClick}
      >
        <Icon>more_vert</Icon>
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 8,
          },
        }}
      >
        {options.map(option => (
          <MenuItem
            key={option.key}
            onClick={() => {
              option.callback()
              handleClose()
            }}
          >
            {option.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

LongMenu.propTypes = {
  className: ReactPropTypes.string.isRequired,
  options: ReactPropTypes.arrayOf(
    ReactPropTypes.shape({
      key: ReactPropTypes.string.isRequired,
      callback: ReactPropTypes.func.isRequired,
      title: ReactPropTypes.string.isRequired,
    }),
  ).isRequired,
}

function TextFieldOrTypography({ onChange, value = '' }) {
  const classes = useStyles()
  const [name, setName] = useState(value)
  const [edit, setEdit] = useState(false)
  return edit ? (
    <TextField
      value={name}
      onChange={event => setName(event.target.value)}
      onBlur={() => {
        setEdit(false)
        onChange(name)
      }}
    />
  ) : (
    <Typography className={classes.viewName} onClick={() => setEdit(true)}>
      {name}
    </Typography>
  )
}
TextFieldOrTypography.propTypes = {
  onChange: ReactPropTypes.func.isRequired,
  value: ReactPropTypes.string, // eslint-disable-line react/require-default-props
}

function Search(props) {
  const { onSubmit } = props
  const [value, setValue] = useState(null)
  const classes = useStyles()

  return (
    <Paper className={classes.searchRoot}>
      <form
        onSubmit={event => {
          onSubmit(value)
          event.preventDefault()
        }}
      >
        <InputBase
          className={classes.input}
          onChange={event => setValue(event.target.value)}
          placeholder="Enter locstring"
        />
        <IconButton className={classes.iconButton} aria-label="search">
          <Icon>search</Icon>
        </IconButton>
      </form>
    </Paper>
  )
}
Search.propTypes = {
  onSubmit: ReactPropTypes.func.isRequired,
}

function Header({ model, header, setHeader }) {
  const classes = useStyles()
  const navTo = locstring => {
    const [refSeq, rest = ''] = locstring.split(':')
    const [start, end] = rest.split('..')
    if (refSeq !== undefined) {
      if (start !== undefined && end !== undefined) {
        model.navTo({ refSeq, start: +start, end: +end })
      } else if (start !== undefined) {
        model.navTo({ refSeq, start: +start })
      } else {
        model.navTo({ refSeq })
      }
    }
  }
  return (
    <div className={classes.headerBar}>
      {model.hideControls ? null : (
        <Controls header={header} setHeader={setHeader} model={model} />
      )}
      <div className={classes.emphasis}>
        <TextFieldOrTypography
          value={model.displayRegionsFromAssemblyName}
          onChange={name => {
            console.log('TODO: update session with new name', name)
          }}
        />
      </div>
      <div className={classes.spacer} />

      <Search onSubmit={navTo} />
      <Select
        value="Select refSeq"
        name="refseq"
        onChange={event => {
          if (event.target.value !== '')
            model.navTo({ refSeq: event.target.value })
        }}
      >
        {model.displayedRegions.map(r => (
          <MenuItem key={r.refName} value={r.refName}>
            {r.refName}
          </MenuItem>
        ))}
      </Select>

      <ZoomControls model={model} />
      <div className={classes.spacer} />
    </div>
  )
}

Header.propTypes = {
  setHeader: ReactPropTypes.func.isRequired,
  header: ReactPropTypes.bool.isRequired,
  model: PropTypes.objectOrObservableObject.isRequired,
}

function Controls({ model, header, setHeader }) {
  const classes = useStyles()
  return (
    <>
      <IconButton
        onClick={model.closeView}
        className={classes.iconButton}
        title="close this view"
      >
        <Icon fontSize="small">close</Icon>
      </IconButton>
      <LongMenu
        className={classes.iconButton}
        options={[
          {
            title: 'Show track selector',
            key: 'track_selector',
            callback: model.activateTrackSelector,
          },
          {
            title: 'Horizontal flip',
            key: 'flip',
            callback: model.horizontallyFlip,
          },
          {
            title: 'Show all regions',
            key: 'showall',
            callback: model.showAllRegions,
          },
          {
            title: header ? 'Hide header' : 'Show header',
            key: 'hide_header',
            callback: () => {
              setHeader(!header)
            },
          },
        ]}
      />
    </>
  )
}

Controls.propTypes = {
  setHeader: ReactPropTypes.func.isRequired,
  header: ReactPropTypes.bool.isRequired,
  model: PropTypes.objectOrObservableObject.isRequired,
}

function LinearGenomeView(props) {
  const { model } = props
  const { id, staticBlocks, tracks, bpPerPx, controlsWidth, offsetPx } = model
  const classes = useStyles()
  const [header, setHeader] = useState(true)

  /*
   * NOTE: offsetPx is the total offset in px of the viewing window into the
   * whole set of concatenated regions. this number is often quite large.
   */
  const style = {
    display: 'grid',
    position: 'relative',
    gridTemplateRows: `${
      header ? '[header] auto ' : ''
    } [scale-bar] auto ${tracks
      .map(
        t =>
          `[track-${t.id}] ${t.height}px [resize-${t.id}] ${dragHandleHeight}px`,
      )
      .join(' ')}`,
    gridTemplateColumns: `[controls] ${controlsWidth}px [blocks] auto`,
  }

  return (
    <div className={classes.root}>
      <div
        className={classes.linearGenomeView}
        key={`view-${id}`}
        style={style}
      >
        {header ? (
          <Header header={header} setHeader={setHeader} model={model} />
        ) : null}
        <div
          className={classnames(classes.controls, classes.viewControls)}
          style={{ gridRow: 'scale-bar' }}
        >
          {model.hideControls || header ? null : (
            <Controls header={header} setHeader={setHeader} model={model} />
          )}
        </div>

        <Rubberband
          style={{
            gridColumn: 'blocks',
            gridRow: 'scale-bar',
          }}
          offsetPx={offsetPx}
          blocks={staticBlocks}
          bpPerPx={bpPerPx}
          model={model}
        >
          <ScaleBar
            style={{
              gridColumn: 'blocks',
              gridRow: 'scale-bar',
            }}
            height={32}
            bpPerPx={bpPerPx}
            blocks={staticBlocks}
            offsetPx={offsetPx}
            horizontallyFlipped={model.horizontallyFlipped}
          />
        </Rubberband>

        {!header ? (
          <div
            className={classes.zoomControls}
            style={{
              right: 4,
              zIndex: 1000,
            }}
          >
            <ZoomControls model={model} />
          </div>
        ) : null}
        {tracks.map(track => (
          <TrackContainer key={track.id} model={model} track={track} />
        ))}
      </div>
    </div>
  )
}
LinearGenomeView.propTypes = {
  model: PropTypes.objectOrObservableObject.isRequired,
}

export default observer(LinearGenomeView)
