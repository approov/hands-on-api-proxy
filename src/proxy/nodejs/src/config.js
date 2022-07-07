const dotenv = require('dotenv').config()

if (dotenv.error) {
  throw dotenv.error
}

const config = {
    PROXY_PORT: dotenv.parsed.HTTP_PORT || undefined,
    NASA_API_HOST: dotenv.parsed.NASA_API_HOST || undefined,
    NASA_IMAGE_HOST: dotenv.parsed.NASA_IMAGE_HOST || undefined,
    NASA_API_KEY: dotenv.parsed.NASA_API_KEY || undefined,
}

let missing_env_vars = ""

Object.entries(config).forEach(([key, value]) => {
    if (value === undefined) {
        missing_env_vars += key + ", "
    }
})

if (missing_env_vars !== "") {
    throw new Error("Missing Env Vars values for: " + missing_env_vars.slice(0, -2)) // removes last comma in the string
}

module.exports = config
