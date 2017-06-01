# Hands On API Proxy Tutorial - Configuration Setup

This node application will elp configure all steps of the tutorial with your
configuration and secrets.

## Get Started

1. **Install [Node 6](https://nodejs.org)** - Need to run multiple versions of Node? Use [nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows).
2. **Change into this node server directory** - `cd proxy-node-server`.
3. **Install Node dependencies** - `npm install`.
4. **Download and unpack the [Approov demo archive](https://www.approov.io/demo-reg.html)**.
5. **Obtain a [NASA API key](https://api.nasa.gov/)**.
6. **Add and update the `secrets.yaml` file** - see secrets.sample.yaml for reference.
7. **Run the configuration** - `npm start`.


**Follow the tutorial article for more complete instructions.**

## Run Time Dependencies

| **Dependency**              | **Use**                                                                    |
| --------------------------- | -------------------------------------------------------------------------- |
| chalk                       | Colorizes console output                                                   |
| commander                   | Handles command lines                                                      |
| fs-extra                    | Provides extra mkdir -p and cp routines                                    |
| js-yaml                     | Provides a yaml parser                                                     |
| selfsigned                  | generates X.509 self-signed  key material                                  |
| url                         | Parses and formats URLs                                                    |
