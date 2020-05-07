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

const url = require('url');
const request = require('request');
const log = require('./../logging')

// load api configuration and secrets
const config = require(`${__dirname}/../config.js`);
const api_host = config.NASA_HOST;
const api_protocol = config.NASA_PROTOCOL;
const nasa_api_key = config.NASA_API_KEY;
const proxy_protocol = 'https'

const apodHostname = 'apod.nasa.gov';
const apodRoute = '/' + apodHostname + '/apod/image/*'
const apodDirect = api_protocol + '://' + apodHostname + '/';
const apodDirectRe = new RegExp(apodDirect.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');


/**
 * Describes NASA API route handlers.
 *
 * @param app the express app.
 */
function routes(app) {

  // proxy a picture of the day request
  app.use(`/${api_host}`, (req, res, next) => {
    log.info('Start Processing the NASA API Request...');

    // build redirected request
    let urlInfo = url.parse(req.url, true);
    urlInfo.protocol = api_protocol;
    urlInfo.host  = api_host;
    urlInfo.query.api_key = nasa_api_key;
    delete urlInfo.search;

    let nasaUrl = url.format(urlInfo);
    log.warning("URL: " + nasaUrl)

    let proxyHome = proxy_protocol + '://' + req.headers.host;
    let apodProxy = proxyHome + '/' + apodHostname + '/';

    // reuse most headers
    let nasaHdrs = req.headers;
    delete nasaHdrs['host'];
    delete nasaHdrs['accept-encoding'];

    // start proxy request
    request({ url: nasaUrl, headers: nasaHdrs }, (err, proxyRes, proxyBody) => {
      if (err) {
        log.fatalError(`Internal Server Error: in NASA proxy: ${err}`);
        res.status(500).send('Internal Server Error');
      } else {

        log.info("Replacing NASA apod image url in the response body...")

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

    let proxyUrl = api_protocol + ':/' + req.url;
    log.warning('Processing NASA apod image request for: ' + proxyUrl);

    let proxyReq = request(proxyUrl);

    // pipe the image request through the proxy
    req.pipe(proxyReq).pipe(res);
  });
}

module.exports = { routes: routes };
