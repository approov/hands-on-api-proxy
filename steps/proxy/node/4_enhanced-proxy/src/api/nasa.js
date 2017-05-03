/*
 * Copyright (C) 2017 CriticalBlue, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const url = require('url');
const request = require('request');
const chalk = require('chalk');

// load api configuration and secrets

const config = require(`${__dirname}/../config.js`);

if (config.nasa_host == null) {
  throw new Error(`nasa_host not found; please set in ${__dirname}/../config.js`);
}
const api_host = config.nasa_host;

if (config.nasa_protocol == null) {
  throw new Error(`nasa_protocol not found; please set in ${__dirname}/../config.js`);
}
const api_protocol = config.nasa_protocol;

const secrets = require(`${__dirname}/../secrets.js`);

if (secrets.nasa_api_key == null) {
  throw new Error(`nasa_api_key not found; please set in ${__dirname}/../secrets.js`);
}
const api_key = secrets.nasa_api_key;

const apodHostname = 'apod.nasa.gov';
const apodRoute = '/' + apodHostname + '/apod/image/*'
const apodDirect = api_protocol + '//' + apodHostname + '/';
const apodDirectRe = new RegExp(apodDirect.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');

/**
 * Describes NASA API route handlers.
 *
 * @param app the express app.
 */
function routes(app) {

  // proxy a picture of the day request

  app.use(`/${api_host}`, (req, res, next) => {
    console.log('Processing NASA API request');

    // build redirected request

    var urlInfo = url.parse(req.url, true);  // build proxied url
    urlInfo.protocol = api_protocol;
    urlInfo.host  = api_host;
    // urlInfo.pathname is req.url
    delete urlInfo.search;
    urlInfo.query.api_key = api_key;         // add nasa api key
    var nasaUrl = url.format(urlInfo);

    var proxyHome = req.protocol + '://' + req.headers.host;
    var apodProxy = proxyHome + '/' + apodHostname + '/';

    var nasaHdrs = req.headers;              // reuse most headers
    delete nasaHdrs['host'];
    delete nasaHdrs['accept-encoding'];

    // start proxy request

    request({ url: nasaUrl, headers: nasaHdrs }, (err, proxyRes, proxyBody) => {
      if (err) {
        console.log(chalk.red(`Internal Server Error: in NASA proxy: ${err}`));
        res.status(500).send('Internal Server Error');
      } else {

        // patch response to redirect any apod image requests through proxy

        proxyBody = proxyBody.replace(apodDirectRe, apodProxy);
        proxyRes.headers["content-length"] = proxyBody.length.toString();

        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.write(proxyBody);
        res.end();
      }
    });
  });

  // proxy a picture of the day image download

  app.get(apodRoute, (req, res, next) => {
    console.log('Processing NASA apod image request', api_protocol + '/' + req.url);

    // console.log('image headers:', JSON.stringify(req.headers, null, '  '));

    // pipe the image request through the proxy

    let proxyUrl = api_protocol + '/' + req.url;
    let proxyReq = request(proxyUrl);

    req.pipe(proxyReq).pipe(res);
  });
}

module.exports = { routes: routes };

// end of file
