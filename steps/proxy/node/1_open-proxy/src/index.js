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

const chalk = require('chalk');
const api = require('./api/nasa');
const app = require('express')();
const config = require('./config.js');

const proxyPort = config.PROXY_PORT

function log_req(req) {
  console.log(chalk.cyan(`Request: ${JSON.stringify({
    originalUrl: req.originalUrl,
    params: req.params,
    headers: req.headers,
  }, null, '  ')}`));
}

// preprocess all proxy requests
api.routes(app)

app.use('/', (req, res, next) => {
  console.log(chalk.red(`Not Found: unhandled api endpoint: ${req.url}`));
  res.status(200).send('Astropik Reverse Proxy...');
});

// process request error

app.use((err, req, res, next) => {
  console.log(chalk.red(`Internal Server Error: ${err}`));
  res.status(500).send('Internal Server Error');
});

// start listening

app.listen(proxyPort, (err) => {
  if (err) {
    return console.log(chalk.red(`Unexpected error tryng to listen on ${proxyPort}:`, err));
  }

  console.log(chalk.green(`api proxy server is listening on ${proxyPort}`));
});
