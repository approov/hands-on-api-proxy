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
const nasa_api_host = config.NASA_API_HOST;
const nasa_api_key = config.NASA_API_KEY;
const apodHostname = config.NASA_IMAGE_HOST;
const apodRoute = '/' + apodHostname + '/apod/image/*'
const apodDirect = 'https://' + apodHostname + '/';
const apodDirectRe = new RegExp(apodDirect.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');

/**
 * Describes NASA API route handlers.
 *
 * @param app the express app.
 */
function routes(app) {

  // proxy a picture of the day request
  app.use(`/:version/${nasa_api_host}`, (req, res, next) => {
    log.info('Start Processing the NASA API Request...');

    let user_agent = req.headers["user-agent"]
    log.info("USER AGENT: " + user_agent)

    // build redirected request
    let urlInfo = url.parse(req.url, true);
    urlInfo.protocol = 'https';
    urlInfo.host  = nasa_api_host;
    urlInfo.query.api_key = nasa_api_key;
    delete urlInfo.search;

    let nasaUrl = url.format(urlInfo);

    // When requests are serverd with traefik we use the protocol from the
    // request header 'x-forwarded-proto', because req.protocol always return
    // the http protocol, and when the server is online we want to use https.
    let request_protocol = req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'] : req.protocol
    let proxyHome = request_protocol + '://' + req.headers.host;
    let apodProxy = proxyHome + '/' + req.params.version + '/' + apodHostname + '/';

    log.info("NASA API URL: " + nasaUrl)
    log.info("NASA APOD URL: " + apodProxy)

    // reuse most headers
    let nasaHdrs = req.headers;
    delete nasaHdrs['host'];
    delete nasaHdrs['accept-encoding'];

    // start proxy request
    request({ url: nasaUrl, headers: nasaHdrs }, (err, proxyRes, proxyBody) => {
      if (err) {
        log.fatalError(`Internal Server Error: in NASA proxy: ${err}`);
        res.status(500).json({error: 'Internal Server Error'});
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
}

module.exports = { routes: routes };
