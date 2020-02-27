const fetch = require('node-fetch');
const qs = require('querystring');
const url = require('url');
const entities = require('entities');

const config = require('./config.json');

async function customSearch(query) {
  if (config.cse == null) {
    throw 'Google API key is not configured correctly.';
  }

  const endpoint = 'https://www.googleapis.com/customsearch/v1';

  const params = {
    q: query,
    fileType: query.endsWith('.gif') ? 'gif' : undefined,

    hl: 'zh-TW',
    num: 1,
    searchType: 'image',

    key: config.cse.key,
    cx: config.cse.cx,

    ...config.params
  };

  const res = await fetch(endpoint + '?' + qs.stringify(params));
  const data = await res.json();

  return data.items[0].link;
}

async function imageSearch(query) {
  const params = {
    q: query,
    tbs: query.endsWith('.gif') ? 'ift:gif' : undefined,
    tbm: 'isch',
    hl: 'zh-TW',
    num: 1
  };

  const headers = {
    'User-Agent':
      'Opera/9.80 (J2ME/MIDP; Opera Mini/9.80 (S60; SymbOS; Opera Mobi/23.348; U; en) Presto/2.5.25 Version/10.54'
  };

  const res = await fetch(
    `https://www.google.com/search?${qs.stringify(params)}`,
    { headers }
  );

  const html = await res.text();
  return extractImageUrl(html);
}

function extractImageUrl(text) {
  const match = text.match(/ href="(\/imgres\?[^"]*)"/);
  if (match == null) {
    throw new Error('image url not found');
  }
  const href = entities.decodeHTML(match[1]);
  return url.parse(href, true).query.imgurl;
}

module.exports = { customSearch, imageSearch };
