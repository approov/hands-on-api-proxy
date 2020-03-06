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
const chalk = require('chalk');

// load api configuration and secrets
const config = require(`${__dirname}/../config.js`);
const api_host = config.NASA_HOST;
const api_protocol = config.NASA_PROTOCOL;
const api_key = config.NASA_API_KEY;

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
    console.log("URL: " + nasaUrl)

    var nasaHdrs = req.headers;              // reuse most headers
    delete nasaHdrs['host'];
    delete nasaHdrs['accept-encoding'];

    // start proxy request

    request({ url: nasaUrl, headers: nasaHdrs }, (err, proxyRes, proxyBody) => {
      if (err) {
        console.log(chalk.red(`Internal Server Error: in NASA proxy: ${err}`));
        res.status(500).send('Internal Server Error');
      } else {

        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.write(proxyBody);
        res.end();
      }
    });
  });
}

module.exports = { routes: routes };

// end of file
