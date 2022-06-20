const dotenv = require('dotenv').config()

if (dotenv.error) {
  throw dotenv.error
}

let isToAbortRequestOnInvalidToken = true
let isToAbortOnInvalidBinding = true
let isToCheckTokenBinding = true

const abortRequestOnInvalidToken = dotenv.parsed.APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN || 'true'
const checkTokenBinding = dotenv.parsed.APPROOV_CHECK_TOKEN_BINDING || 'true'
const abortOnInvalidTokenBinding = dotenv.parsed.APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN_BINDING || 'true'

if (abortRequestOnInvalidToken.toLowerCase() === 'false') {
  isToAbortRequestOnInvalidToken = false
}

if (checkTokenBinding.toLowerCase() === 'false') {
  isToCheckTokenBinding = false
}

if (abortOnInvalidTokenBinding.toLowerCase() === 'false') {
  isToAbortOnInvalidBinding = false
}

const approov = {
  abortRequestOnInvalidToken: isToAbortRequestOnInvalidToken,
  isToCheckTokenBinding: isToCheckTokenBinding,
  abortRequestOnInvalidTokenBinding: isToAbortOnInvalidBinding,

  // The Approov base64 secret must be retrieved with the Approov CLI tool
  base64Secret: dotenv.parsed.APPROOV_TOKEN_BASE64_SECRET,
}

module.exports = {
    approov
}
