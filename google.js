const fetch = require('node-fetch')
const htmlparser2 = require('htmlparser2')
const domhandler = require('domhandler')
const domutils = require('domutils')
const qs = require('querystring')

const config = require('./config.json')

async function customSearch(query) {
  if (config.cse == null) {
    throw 'Google API key is not configured correctly.'
  }

  const endpoint = 'https://www.googleapis.com/customsearch/v1'

  const params = {
    q: query,
    fileType: query.endsWith('.gif') ? 'gif' : undefined,

    hl: 'zh-TW',
    num: 1,
    searchType: 'image',

    key: config.cse.key,
    cx: config.cse.cx,

    ...config.params
  }

  const res = await fetch(endpoint + '?' + qs.stringify(params))
  const data = await res.json()

  return data.items[0].link
}

async function imageSearch(query) {
  const params = {
    q: query,
    tbs: query.endsWith('.gif') ? 'ift:gif' : undefined,
    tbm: 'isch',
    hl: 'zh-TW',
    num: 1
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
    DNT: '1'
  }

  const res = await fetch(
    `https://www.google.com/search?${qs.stringify(params)}`,
    { headers }
  )

  const dom = await parseHtml(res.body)

  const url = getUrlFromScript(dom) || getUrlFromRgMeta(dom)

  if (url == null) {
    throw new Error('image url not found')
  }

  return url
}

function parseHtml(stream) {
  return new Promise((resolve, reject) => {
    const handler = new domhandler.DomHandler((err, dom) => {
      if (err) {
        reject(err)
      } else {
        resolve(dom)
      }
    })
    const parser = new htmlparser2.WritableStream(handler)
    stream.pipe(parser)
  })
}

function getUrlFromScript(dom) {
  const scripts = domutils
    .findAll(e => e.name === 'script', dom)
    .map(elem => domutils.getText(elem))
  const prefix =
    "AF_initDataCallback({key: 'ds:2', isError:  false , hash: '3', data:function(){return "
  const suffix = '}});'
  for (const script of scripts) {
    if (script.startsWith(prefix) && script.endsWith(suffix)) {
      const json = script.substring(
        prefix.length,
        script.length - suffix.length
      )
      const data = JSON.parse(json)
      const url = get(data, [31, 0, 12, 2, 0, 1, 3, 0])
      return typeof url === 'string' ? url : null
    }
  }
}

function getUrlFromRgMeta(dom) {
  const elem = domutils.findOne(e => {
    const className = domutils.getAttributeValue(e, 'class')
    return /(^|\s)rg_meta($|\s)/.test(className)
  }, dom)
  if (elem != null) {
    const json = domutils.getText(elem)
    return JSON.parse(json).ou
  } else {
    return null
  }
}

function get(data, path) {
  for (let i = 0, len = path.length; i < len; ++i) {
    if (data == null) break
    data = data[path[i]]
  }
  return data
}

module.exports = { customSearch, imageSearch }
