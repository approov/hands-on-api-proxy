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
const jwt = require('jsonwebtoken');
const request = require('request');
const chalk = require('chalk');

// load approov config and secrets

const secrets = require(`${__dirname}/secrets.js`);

if (secrets.approov_token_secret == null) {
  throw new Error(`approov_token_secret not found; please set in ${__dirname}/secrets.js`);
}
const sigkey = Buffer.from(secrets.approov_token_secret, 'base64');
const extraChecks = { algorithms: ['HS256'] };

const config = require(`${__dirname}/config.js`);

var enforceApproov = true;
if (config.approov_enforcement == null) {
  console.log(chalk.red(`\nCAUTION: approov_enforcement not found; please set in ${__dirname}/config.js\n`));
} else {
  enforceApproov = config.approov_enforcement;
}

if (!enforceApproov) {
  console.log(chalk.red('\nCAUTION: Approov token checking is disabled!\n'));
}

function isEnforced() {
  return enforceApproov;
}

function isValid(token) {
  var verified = true;

  try {
    var decoded = jwt.verify(token, sigkey, extraChecks);
  } catch (err) {
    verified = false;
  }

  if (verified) {
    console.log(chalk.blue('Approov token verified'));
  } else {
    console.log(chalk.red('Approov token not verified'));
  }

  return verified || !enforceApproov;
}


module.exports = {
  isEnforced: isEnforced,
  isValid: isValid
};

// end of file
