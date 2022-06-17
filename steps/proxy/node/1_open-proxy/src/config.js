const dotenv = require('dotenv').config({path: "./../../../../.env", debug: true})

if (dotenv.error) {
  throw dotenv.error
}

const config = {
    PROXY_PORT: dotenv.parsed.STEP_1_PROXY_PORT || undefined,
    NASA_HOST: dotenv.parsed.NASA_HOST || undefined,
    NASA_PROTOCOL: dotenv.parsed.NASA_PROTOCOL || undefined,
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
