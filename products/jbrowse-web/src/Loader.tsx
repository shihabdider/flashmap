import PluginManager from '@jbrowse/core/PluginManager'
import PluginLoader from '@jbrowse/core/PluginLoader'
import { inDevelopment, fromUrlSafeB64 } from '@jbrowse/core/util'
import { openLocation } from '@jbrowse/core/util/io'
import ErrorBoundary from 'react-error-boundary'
import { UndoManager } from 'mst-middlewares'
import React, { useEffect, useState } from 'react'
import {
  StringParam,
  useQueryParam,
  QueryParamProvider,
} from 'use-query-params'
import { AnyConfigurationModel } from '@jbrowse/core/configuration/configurationSchema'
import { SnapshotOut } from 'mobx-state-tree'
import { PluginConstructor } from '@jbrowse/core/Plugin'
import { FatalErrorDialog } from '@jbrowse/core/ui'
import { TextDecoder, TextEncoder } from 'fastestsmallesttextencoderdecoder'
import CircularProgress from '@material-ui/core/CircularProgress'
import * as crypto from 'crypto'
import 'typeface-roboto'
import 'requestidlecallback-polyfill'
import 'core-js/stable'
import shortid from 'shortid'
import { createBrowserHistory } from 'history'
import { readSessionFromDynamo } from './sessionSharing'
import Loading from './Loading'
import corePlugins from './corePlugins'
import JBrowse from './JBrowse'
import JBrowseRootModelFactory from './rootModel'
import packagedef from '../package.json'

if (!window.TextEncoder) {
  window.TextEncoder = TextEncoder
}
if (!window.TextDecoder) {
  window.TextDecoder = TextDecoder
}

function NoConfigMessage() {
  // TODO: Link to docs for how to configure JBrowse
  return (
    <>
      <h4>JBrowse has not been configured yet.</h4>
      {inDevelopment ? (
        <>
          <div>Available development configs:</div>
          <ul>
            <li>
              <a href="?config=test_data/config.json">Human basic</a>
            </li>
            <li>
              <a href="?config=test_data/config_demo.json">Human extended</a>
            </li>
            <li>
              <a href="?config=test_data/tomato/config.json">Tomato SVs</a>
            </li>
            <li>
              <a href="?config=test_data/volvox/config.json">Volvox</a>
            </li>
            <li>
              <a href="?config=test_data/breakpoint/config.json">Breakpoint</a>
            </li>
            <li>
              <a href="?config=test_data/config_dotplot.json">
                Grape/Peach Dotplot
              </a>
            </li>
            <li>
              <a href="?config=test_data/config_human_dotplot.json">
                hg19/hg38 Dotplot
              </a>
            </li>
            <li>
              <a href="?config=test_data/config_synteny_grape_peach.json">
                Grape/Peach Synteny
              </a>
            </li>
            <li>
              <a href="?config=test_data/yeast_synteny/config.json">
                Yeast Synteny
              </a>
            </li>
            <li>
              <a href="?config=test_data/config_longread.json">
                Long Read vs. Reference Dotplot
              </a>
            </li>
            <li>
              <a href="?config=test_data/config_longread_linear.json">
                Long Read vs. Reference Linear
              </a>
            </li>
            <li>
              <a href="?config=test_data/config_many_contigs.json">
                Many Contigs
              </a>
            </li>
            <li>
              <a href="?config=test_data/config_honeybee.json">Honeybee</a>
            </li>
          </ul>
        </>
      ) : null}
    </>
  )
}

type Config = SnapshotOut<AnyConfigurationModel>

export function Loader() {
  const bc1 =
    typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel('jb_request_session')
  const bc2 =
    typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel('jb_respond_session')
  const [configSnapshot, setConfigSnapshot] = useState<Config>()
  const [noDefaultConfig, setNoDefaultConfig] = useState(false)
  const [plugins, setPlugins] = useState<PluginConstructor[]>()

  const [configQueryParam] = useQueryParam('config', StringParam)
  const [sessionQueryParam, setSessionQueryParam] = useQueryParam(
    'session',
    StringParam,
  )
  const [passwordQueryParam, setPasswordQueryParam] = useQueryParam(
    'password',
    StringParam,
  )
  const [loadingState, setLoadingState] = useState(false)
  const [key] = useState(crypto.createHash('sha256').update('JBrowse').digest())
  const [adminKeyParam] = useQueryParam('adminKey', StringParam)
  const adminMode = adminKeyParam !== undefined
  const loadingSharedSession = sessionQueryParam?.startsWith('share-')

  // on share link pasted, reads from dynamoDB to fetch and decode session
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    function setData(data?: string) {
      setSessionQueryParam(data)
      setPasswordQueryParam(undefined)
    }

    async function readSharedSession() {
      if (sessionQueryParam && loadingSharedSession) {
        setLoadingState(false)
        try {
          const decryptedSession = await readSessionFromDynamo(
            sessionQueryParam,
            key,
            passwordQueryParam || '',
            signal,
          )

          if (decryptedSession) {
            const fromShared = JSON.parse(fromUrlSafeB64(decryptedSession))
            sessionStorage.setItem('current', JSON.stringify(fromShared))
            setData(fromShared.id)
          } else {
            // eslint-disable-next-line no-alert
            alert('Session could not be decrypted with given password')
            setData()
          }
        } catch (e) {
          // eslint-disable-next-line no-alert
          alert(`Failed to find session in database: ${e}`)
          setData()
        }
      }
    }
    readSharedSession()
    return () => {
      controller.abort()
      setLoadingState(false)
    }
  }, [
    key,
    loadingSharedSession,
    passwordQueryParam,
    sessionQueryParam,
    setPasswordQueryParam,
    setSessionQueryParam,
  ])

  // on local link posted, checks other tabs if they have session stored in sessionStorage
  useEffect(() => {
    function setData(data?: string) {
      setSessionQueryParam(data)
      setPasswordQueryParam(undefined)
    }
    ;(async () => {
      if (sessionQueryParam && !loadingSharedSession) {
        const sessionStorageSession = JSON.parse(
          sessionStorage.getItem('current') || '{}',
        )
        const foundLocalSession =
          localStorage.getItem(sessionQueryParam) ||
          (sessionStorageSession.id === sessionQueryParam
            ? sessionStorageSession
            : null)

        if (!foundLocalSession) {
          if (bc1) {
            bc1.postMessage(sessionQueryParam)
            try {
              const result = await new Promise((resolve, reject) => {
                if (bc2) {
                  bc2.onmessage = msg => {
                    resolve(msg.data)
                  }
                }
                setTimeout(() => {
                  console.log('rejecting because of timeout')
                  reject()
                }, 1000)
              })
              // @ts-ignore
              result.id = shortid()
              sessionStorage.setItem('current', JSON.stringify(result))
              // @ts-ignore
              setData(result.id)
            } catch (e) {
              console.error(e)
            }
          }
        }
      }
    })()
  }, [
    bc1,
    bc2,
    sessionQueryParam,
    setPasswordQueryParam,
    setSessionQueryParam,
    loadingSharedSession,
  ])

  useEffect(() => {
    async function fetchConfig() {
      const configLocation = {
        uri: configQueryParam || 'config.json',
        baseUri: '',
      }
      let configText = ''
      try {
        const location = openLocation(configLocation)
        configText = (await location.readFile('utf8')) as string
      } catch (error) {
        if (configQueryParam && configQueryParam !== 'config.json') {
          setConfigSnapshot(() => {
            throw new Error(`Problem loading config, "${error.message}"`)
          })
        } else {
          setNoDefaultConfig(true)
        }
      }
      let config
      if (configText) {
        try {
          config = JSON.parse(configText)
          const configUri = new URL(configLocation.uri, window.location.origin)
          addRelativeUris(config, configUri)
        } catch (error) {
          setConfigSnapshot(() => {
            throw new Error(`Can't parse config JSON: ${error.message}`)
          })
        }
        setConfigSnapshot(config)
      }
    }
    fetchConfig()
  }, [configQueryParam])

  useEffect(() => {
    async function fetchPlugins() {
      // Load runtime plugins
      if (configSnapshot) {
        try {
          const pluginLoader = new PluginLoader(configSnapshot.plugins)
          pluginLoader.installGlobalReExports(window)
          const runtimePlugins = await pluginLoader.load()
          setPlugins([...corePlugins, ...runtimePlugins])
        } catch (error) {
          setConfigSnapshot(() => {
            throw error
          })
        }
      }
    }
    fetchPlugins()
  }, [configSnapshot])

  if (noDefaultConfig) {
    return <NoConfigMessage />
  }

  if (!(configSnapshot && plugins)) {
    return <Loading />
  }

  const pluginManager = new PluginManager(plugins.map(P => new P()))

  pluginManager.createPluggableElements()

  const JBrowseRootModel = JBrowseRootModelFactory(pluginManager, adminMode)

  let rootModel
  try {
    if (configSnapshot) {
      rootModel = JBrowseRootModel.create({
        jbrowse: configSnapshot,
        assemblyManager: {},
        version: packagedef.version,
      })
    }
  } catch (error) {
    // if it failed to load, it's probably a problem with the saved sessions,
    // so just delete them and try again
    try {
      console.error(error)
      console.warn(
        'deleting saved sessions and re-trying after receiving the above error',
      )
      rootModel = JBrowseRootModel.create({
        jbrowse: { ...configSnapshot },
        assemblyManager: {},
        version: packagedef.version,
      })
    } catch (e) {
      console.error(e)
      const additionalMsg =
        e.message.length > 10000 ? '... see console for more' : ''
      throw new Error(e.message.slice(0, 10000) + additionalMsg)
    }
  }
  if (!rootModel) {
    throw new Error('could not instantiate root model')
  }
  // in order: saves the previous autosave for recovery, tries to load the local session
  // if session in query, or loads the default session
  try {
    const lastAutosave = localStorage.getItem('autosave')
    if (lastAutosave) {
      localStorage.setItem('localSaved-previousAutosave', lastAutosave)
    }
    if (sessionQueryParam) {
      const foundLocalSession = localStorage.getItem(sessionQueryParam)
      if (foundLocalSession) {
        rootModel.setSession(JSON.parse(foundLocalSession).session)
      } else {
        const session = sessionStorage.getItem('current')
        if (session && JSON.parse(session).id === sessionQueryParam) {
          rootModel.setSession(JSON.parse(session))
        } else if (!loadingSharedSession) {
          // eslint-disable-next-line no-alert
          alert('No matching local session found')
          setSessionQueryParam(undefined)
          setPasswordQueryParam(undefined)
        }
      }
    } else {
      rootModel.setDefaultSession()
      // setSessionQueryParam(localId)
      // setPasswordQueryParam(undefined)
    }

    if (!rootModel.session) return null
    rootModel.setHistory(
      UndoManager.create({}, { targetStore: rootModel.session }),
    )
  } catch (e) {
    console.error(e)
    if (e.message) {
      throw new Error(e.message.slice(0, 10000))
    } else {
      throw e
    }
  }
  // make some things available globally for testing
  // e.g. window.MODEL.views[0] in devtools
  // @ts-ignore
  window.MODEL = rootModel.session
  // @ts-ignore
  window.ROOTMODEL = rootModel
  pluginManager.setRootModel(rootModel)

  pluginManager.configure()

  if (bc1) {
    bc1.onmessage = msg => {
      const ret = JSON.parse(sessionStorage.getItem('current') || '{}')
      if (ret.id === msg.data) {
        if (bc2) {
          bc2.postMessage(ret)
        }
      }
    }
  }

  return loadingState ? (
    <CircularProgress />
  ) : (
    <JBrowse pluginManager={pluginManager} />
  )
}

function addRelativeUris(config: Config, configUri: URL) {
  if (typeof config === 'object') {
    for (const key of Object.keys(config)) {
      if (typeof config[key] === 'object') {
        addRelativeUris(config[key], configUri)
      } else if (key === 'uri') {
        config.baseUri = configUri.href
      }
    }
  }
}

function factoryReset() {
  // @ts-ignore
  window.location = window.location.pathname
}
const PlatformSpecificFatalErrorDialog = (props: unknown) => {
  return <FatalErrorDialog onFactoryReset={factoryReset} {...props} />
}

// the history tracking and forceUpdate are related to use-query-params,
// because the setters from use-query-params don't cause a component rerender
// if a router system is not used. see the no-router example here
// https://github.com/pbeshai/use-query-params/blob/master/examples/no-router/src/App.js
const history = createBrowserHistory()

export default () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  useEffect(() => {
    history.listen(() => {
      forceUpdate()
    })
  }, [])

  return (
    <ErrorBoundary FallbackComponent={PlatformSpecificFatalErrorDialog}>
      <QueryParamProvider>
        <Loader />
      </QueryParamProvider>
    </ErrorBoundary>
  )
}
