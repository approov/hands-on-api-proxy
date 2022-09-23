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

const request = require('request')
const log = require('./../logging')
const config = require(`${__dirname}/../config.js`)

const apodHostname = config.NASA_IMAGE_HOST

/**
 * Describes NASA API route handlers.
 *
 * @param app the express app.
 */
function routes(app) {

  // proxy a picture of the day image download
  app.get(`/:version/${apodHostname}/apod/image/*`, (req, res, next) => {

    let proxyUrl = req.url.replace('/' + req.params.version + '/', 'https://');
    log.info("IMAGE URL: " + proxyUrl)

    let proxyReq = request(proxyUrl);

    // pipe the image request through the proxy
    req.pipe(proxyReq).pipe(res);
  });
}

module.exports = { routes: routes };
