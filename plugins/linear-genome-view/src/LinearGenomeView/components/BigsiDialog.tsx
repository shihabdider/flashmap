import React, { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react'
import { Region } from '@jbrowse/core/util/types'
import { readConfObject } from '@jbrowse/core/configuration'
import { makeStyles } from '@material-ui/core/styles'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Container,
  Typography,
  Divider,
  IconButton,
  TextField,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import { getSession } from '@jbrowse/core/util'
import { Feature } from '@jbrowse/core/util/simpleFeature'
import { formatSeqFasta, SeqChunk } from '@jbrowse/core/util/formatFastaStrings'
import { LinearGenomeViewModel } from '..'
import queryBigsi from './bigsi/query_bigsi'
import bigsi from './bigsi/bigsis/hg38_chr1and2.json'

const useStyles = makeStyles(theme => ({
  loadingMessage: {
    padding: theme.spacing(5),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  dialogContent: {
    width: '80em',
  },
  textAreaFont: {
    fontFamily: 'Courier New',
  },
}))

/**
 * Fetches and returns a list features for a given list of regions
 * @param selectedRegions - Region[]
 * @returns Features[]
 */
export async function fetchSequence(
  self: LinearGenomeViewModel,
  selectedRegions: Region[],
) {
  const session = getSession(self)
  const assemblyName =
    self.leftBigsiOffset?.assemblyName || self.rightBigsiOffset?.assemblyName || ''
  const refName =
    self.leftBigsiOffset?.refName || self.rightBigsiOffset?.refName || ''
  const { rpcManager, assemblyManager } = session
  const assemblyConfig = assemblyManager.get(assemblyName)?.configuration

  // assembly configuration
  const adapterConfig = readConfObject(assemblyConfig, ['sequence', 'adapter'])

  const sessionId = 'getSequence'
  const chunks = (await Promise.all(
    selectedRegions.map(region =>
      rpcManager.call(sessionId, 'CoreGetFeatures', {
        adapterConfig,
        region,
        sessionId,
      }),
    ),
  )) as Feature[][]

  // console.log(chunks[0][0].data.seq)
  const response = await queryBigsi.main(bigsi, chunks[0][0].data.seq)
  console.log('response: ', response)
    
  const allFeatures = []
  for (let i=0; i < response.length; i++){
    const bigsiFeatures = Object.values(response[i])
    console.log('bigsiFeatures: ', bigsiFeatures)
    for (let i=0; i < bigsiFeatures.length; i++){
        bigsiFeatures[i]['uniqueId'] = parseInt(i)
        bigsiFeatures[i]['name'] = `${bigsiFeatures[i]['refName']}:${bigsiFeatures[i]['start']}-${bigsiFeatures[i]['end']}`
        bigsiFeatures[i]['start'] = self.leftBigsiOffset.coord
        bigsiFeatures[i]['end'] = self.rightBigsiOffset.coord
        bigsiFeatures[i]['refName'] = refName
        allFeatures.push(bigsiFeatures[i])
        }
    }

    const bigsiQueryTrack = {
            trackId: `track-${Date.now()}`,
            name: `BIGSI Query ${assemblyName}:Chr${refName}:${self.leftBigsiOffset.coord}-${self.rightBigsiOffset.coord}`,
            assemblyNames: ['hg38'],
            type: 'FeatureTrack',
            adapter: {
                type: 'FromConfigAdapter',
                features: allFeatures,
                //features: [ { "refName": "1", "start":1, "end":200000, "uniqueId": "id1" }],
                },
            }

    session.addTrackConf(bigsiQueryTrack)

    self.showTrack(bigsiQueryTrack.trackId)
  //console.log(response)

  // assumes that we get whole sequence in a single getFeatures call
  return chunks.map(chunk => chunk[0])
}

function BigsiDialog({
  model,
  handleClose,
}: {
  model: LinearGenomeViewModel
  handleClose: () => void
}) {
  const classes = useStyles()
  const session = getSession(model)
  const [error, setError] = useState<Error>()
  const [sequence, setSequence] = useState('')
  const loading = Boolean(!sequence) || Boolean(error)
  const { leftBigsiOffset, rightBigsiOffset } = model

  // avoid infinite looping of useEffect
  // random note: the current selected region can't be a computed because it
  // uses action on base1dview even though it's on the ephemeral base1dview
  const regionsSelected = useMemo(
    () => model.getSelectedRegions(leftBigsiOffset, rightBigsiOffset),
    [model, leftBigsiOffset, rightBigsiOffset],
  )

  console.log('regionsSelected', regionsSelected)

  useEffect(() => {
    let active = true

    function formatSequence(seqChunks: Feature[]) {
      const sequenceChunks: SeqChunk[] = []
      const incompleteSeqErrs: string[] = []
      seqChunks.forEach((chunk: Feature) => {
        const chunkSeq = chunk.get('seq')
        const chunkRefName = chunk.get('refName')
        const chunkStart = chunk.get('start') + 1
        const chunkEnd = chunk.get('end')
        const chunkLocstring = `${chunkRefName}:${chunkStart}-${chunkEnd}`
        if (chunkSeq) {
          sequenceChunks.push({ header: chunkLocstring, seq: chunkSeq })
          if (chunkSeq.length !== chunkEnd - chunkStart + 1) {
            incompleteSeqErrs.push(
              `${chunkLocstring} returned ${chunkSeq.length.toLocaleString()} bases, but should have returned ${(
                chunkEnd - chunkStart
              ).toLocaleString()}`,
            )
          }
        }
      })
      if (incompleteSeqErrs.length > 0) {
        session.notify(
          `Unable to retrieve complete reference sequence from regions:${incompleteSeqErrs.join()}`,
        )
      }
      setSequence(formatSeqFasta(sequenceChunks))
    }

    ;(async () => {
      try {
        if (regionsSelected.length > 0) {
          const chunks = await fetchSequence(model, regionsSelected)
          if (active) {
            formatSequence(chunks)
          }
        } else {
          throw new Error('Selected region is out of bounds')
        }
      } catch (e) {
        console.error(e)
        if (active) {
          setError(e)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [model, session, regionsSelected, setSequence])

  const sequenceTooLarge = sequence.length > 300_000

  return (
    <Dialog
      data-testid="bigsi-dialog"
      maxWidth="xl"
      open
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Bigsi Query
        {handleClose ? (
          <IconButton
            data-testid="close-BigsiDialog"
            className={classes.closeButton}
            onClick={() => {
              handleClose()
              model.setBigsiOffsets(undefined, undefined)
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
      <Divider />

      <DialogContent>
        {error ? <Typography color="error">{`${error}`}</Typography> : null}
        {loading && !error ? (
          <Container>
            Select reference sequences to query
          </Container>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            handleClose()
            model.setBigsiOffsets(undefined, undefined)
          }}
          color="primary"
          autoFocus
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default observer(BigsiDialog)
