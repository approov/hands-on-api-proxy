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

const { expressjwt: jwt } = require('express-jwt');
const crypto = require('crypto')
const config = require('./approov-config')
const log = require('./logging')

////////////////////////////////////////////////////////////////////////////////
/// YOUR APPLICATION CUSTOMIZABLE CALLBACKS FOR THE APPROOV INTEGRATION
////////////////////////////////////////////////////////////////////////////////
///
/// Feel free to customize this callbacks to best suite the needs your needs.
///

const buildLogMessagePrefix = function(req, res) {
  return res.statusCode + ' ' + req.method + ' ' + req.originalUrl
}

// Callback to be customized with your preferred way of logging.
const logError = function(req, res, message) {
  log.error(buildLogMessagePrefix(req, res) + ' ' + message)
}

const logSuccess = function(req, res, message) {
  log.success(buildLogMessagePrefix(req, res) + ' ' + message)
}

const logInfo = function(req, res, message) {
  log.info(buildLogMessagePrefix(req, res) + ' ' + message)
}

const logWarning = function(req, res, message) {
  log.warning(buildLogMessagePrefix(req, res) + ' ' + message)
}

// Callback to be personalized in order to get the token binding header value being used by
// your application.
// In the current scenario we use an Authorization token, but feel free to use what
// suits best your needs.
const getTokenBindingHeader = function(req) {
  return req.get('Authorization')
}

// Callback to be customized with how you want to handle a request with an
// invalid Approov token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidApproovToken = function(err, req, res, next, httpStatusCode) {

  logError(req, res, 'APPROOV TOKEN: ' + err)

  // Logging a message to make clear in the logs what was the action we took.
  // Feel free to skip it if you think is not necessary to your use case.
  let message = 'REQUEST WITH INVALID APPROOV TOKEN'

  if (config.approov.abortRequestOnInvalidToken === true) {
    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + message)
    return
  }

  message = 'ACCEPTED ' + message
  logSuccess(req, res, message)
  next()
  return
}

// Callback to be customized with how you want to handle a request where the
// token binding in the request header doesn't match the the one in the Approov token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidTokenBinding = function(req, res, next, httpStatusCode, message) {

  logWarning(req, res, message)

  // Logging here to make clear in the logs what was the action we took.
  // Feel free to skip it if you think is not necessary to your use case.
  let logMessage = 'REQUEST WITH INVALID APPROOV TOKEN BINDING'

  if (config.approov.abortRequestOnInvalidTokenBinding === true) {
    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + logMessage)
    return
  }

  logSuccess(req, res, 'ACCEPTED ' + logMessage)
  next()
  return
}

// Callback to build the response when a request fails to pass the Approov checks.
const buildBadRequestResponse = function(req, res, httpStatusCode, logMessage) {
  res.status(httpStatusCode)
  logError(req, res, logMessage)
  res.json({})
}

////////////////////////////////////////////////////////////////////////////////
/// STARTS NON CUSTOMIZABLE LOGIC FOR THE APPROOV INTEGRATION
////////////////////////////////////////////////////////////////////////////////
///
/// This section contains code that is specific to the Approov integration,
/// thus we think that is not necessary to customize it, once is not
/// interfering with your application logic or behavior.
///

////// APPROOV HELPER FUNCTIONS //////

const isEmpty = function(value) {
  return  (value === undefined) || (value === null) || (value === '')
}

const isString = function(value) {
  return (typeof(value) === 'string')
}

const isEmptyString = function(value) {
  return (isEmpty(value) === true) || (isString(value) === false) ||  (value.trim() === '')
}


////// APPROOV TOKEN //////


// Callback that performs the Approov token check using the express-jwt library
const checkApproovToken = jwt({
  secret: Buffer.from(config.approov.base64Secret, 'base64'), // decodes the Approov secret
  requestProperty: 'approovTokenDecoded',
  getToken: function fromApproovTokenHeader(req, res) {
    req.approovTokenError = false
    const approovToken = req.get('Approov-Token')

    if (isEmptyString(approovToken)) {
      req.approovTokenError = true
      throw new Error('Approov Token empty or missing in the header of the request.')
    }

    return approovToken
  },
  algorithms: ['HS256']
})

// Callback to handle the errors occurred while checking the Approov token.
const handlesApproovTokenError = function(err, req, res, next) {

  if (req.approovTokenError === true) {
    // When we reach here, it means the header `Approov-Token` is empty or is missing.
    // @see checkApproovToken()
    handlesRequestWithInvalidApproovToken(err, req, res, next, 400)
    return
  }

  if (err.name === 'UnauthorizedError') {
    // When we reach here, it means that an Error was thrown by the express-jwt
    // library while decoding the Approov token.
    // @see checkApproovToken()
    req.approovTokenError = true
    handlesRequestWithInvalidApproovToken(err, req, res, next, 401)
    return
  }

  next()
  return
}

// Callback to handles when an Approov token is successfully validated.
const handlesApproovTokenSuccess = function(req, res, next) {

    if (req.approovTokenError === false) {
      logSuccess(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN')
    }

    next()
    return
}


////// APPROOV TOKEN BINDING //////


// Callback to check the Approov token binding in the header matches with the one in the key `pay` of the Approov token claims.
const handlesApproovTokenBindingVerification = function(req, res, next){

  if (! config.approov.isToCheckTokenBinding) {
    next()
    return
  }

  let token_binding_payload = undefined

  if (req.approovTokenError === true) {
    next()
    return
  }

  if ("pay" in req.approovTokenDecoded) {
    // The decoded Approov token was added to the request object when the checked it at `checkApproovToken()`
    token_binding_payload = req.approovTokenDecoded.pay
  }

  if (token_binding_payload === undefined) {
    logWarning(req, res, "APPROOV TOKEN BINDING WARNING: key 'pay' is missing.")
    logInfo(req, res, 'ACCEPTED REQUEST WITH APPROOV TOKEN BINDING MISSING')
    next()
    return
  }

  if (isEmptyString(token_binding_payload)) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING WARNING: key 'pay' in the decoded token is empty.")
      return
  }

  // We use here the Authorization token, but feel free to use another header, but you need to bind this  header to
  // the Approov token in the mobile app.
  const token_binding_header = getTokenBindingHeader(req)

  if (isEmptyString(token_binding_header)) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING WARNING: Missing or empty header to perform the verification for the token binding.")
      return
  }

  // We need to hash and base64 encode the token binding header, because that's how it was included in the Approov
  // token on the mobile app.
  const token_binding_header_encoded = crypto.createHash('sha256').update(token_binding_header, 'utf-8').digest('base64')

  if (token_binding_payload !== token_binding_header_encoded) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 401, "APPROOV TOKEN BINDING WARNING: token binding in header doesn't match with the key 'pay' in the decoded token.")
      return
  }

  logSuccess(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN BINDING')

  // Let the request continue as usual.
  next()
  return
}

module.exports = {
  checkApproovToken,
  handlesApproovTokenError,
  handlesApproovTokenSuccess,
  handlesApproovTokenBindingVerification,
}

