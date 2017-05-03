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
const chalk = require('chalk');
const app = require('express')();

// load and check port

const config = require(`${__dirname}/config.js`);

const proxyPort = process.env.PROXY_PORT || config.proxy_port || 8080;
if ((process.env.PROXY_PORT == null) && (config.proxy_port  == null)) {
  console.log(chalk.red(`\nCAUTION: proxy_port not found; please set in ${__dirname}/config.js\n`));
}

function log_req(req) {
  console.log(chalk.cyan(`Request: ${JSON.stringify({
    originalUrl: req.originalUrl,
    params: req.params,
    headers: req.headers,
  }, null, '  ')}`));
}

// preprocess all proxy requests

app.use((req, res, next) => {
  // just pass through each request

  //log_req(req);

  next();
});

// process nasa api proxy routes

require(__dirname + '/api/nasa').routes(app, proxyPort);

// add more proxy routes here...

// process unhandled routes

app.use('/', (req, res, next) => {
  console.log(chalk.red(`Not Found: unhandled api endpoint: ${req.url}`));
  res.status(404).send('Not Found');
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

// end of file
