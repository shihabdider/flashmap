// Adapted from https://github.com/GMOD/jbrowse/blob/master/src/JBrowse/Store/Hash.js
import { objectHash } from 'object-hash'

export default class HTTPMap {
  public constructor(args) {
    // make sure url has a trailing slash
    this.url = /\/$/.test(args.url) ? args.url : `${args.url}/`
    this.meta = {}

    this.browser = args.browser
    //   const isElectron = typeof window !== 'undefined' && Boolean(window.electron)
    this.isElectron = args.isElectron

    // this.ready is a Deferred that will be resolved when we have
    // read the meta.json file with the params of this hashstore
    this.ready = this.readMeta()
  }

  private async loadFile(id: string) {
    const response = await fetch(`${this.url}/${id}`)
    return response.json()
  }

  /**
   * loads meta.json file from names directory and reads number of hash_bits used
   */
  private async readMeta() {
    this.meta = await this.loadFile('meta.json')
    this.meta.hash_hex_characters = Math.ceil(this.meta.hash_bits / 4)
  }

  /**
   * Returns the contents of the bucket given a key
   */
  async get(key) {
    const bucket = await this.getBucket(key)
    return bucket[key]
  }

  /**
   * Returns a bucket given a key
   */
  async getBucket(key) {
    await this.ready
    const bucketIdent = this.hash(key)
    try {
      const value = await this.loadFile(this.hexToDirPath(bucketIdent))
      return value
    } catch (err) {
      if (this.isElectron || err.status === 404) {
        // 404 is expected if the name is not in the store
        return {}
      }
    }
    return {}
  }

  private hexToDirPath(hex: string) {
    // zero-pad the hex string to be 8 chars if necessary
    while (hex.length < 8) hex = `0${hex}`
    hex = hex.substr(8 - this.meta.hash_hex_characters)
    const dirpath = []
    for (let i = 0; i < hex.length; i += 3) {
      dirpath.push(hex.substring(i, i + 3))
    }
    return `${dirpath.join('/')}.json${this.meta.compress ? 'z' : ''}`
  }

  private hash(data) {
    // TODO replace with crc32 from util in jbrowse1 legacy plugin once this gets moved to that plugin
    return objectHash(data).toString(16).toLowerCase().replace('-', 'n')
  }
}
