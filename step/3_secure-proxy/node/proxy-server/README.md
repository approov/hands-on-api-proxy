# Hands On API Proxy Tutorial - Node Proxy Server

This is a simple proxy server implementation in Node as part of the Hands On API Proxy tutorial.

## Get Started

1. **Install [Node 6](https://nodejs.org)** - Need to run multiple versions of Node? Use [nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows).
2. **Change into this node server directory** - `cd proxy-node-server`.
3. **Install Node dependencies** - `npm install`.
4. **Update the `src/config.js` file if desired**.
5. **Add and update the `src/secrets.js` file** - see src/secrets.sample.js.
6. **Run the development server** - `npm start`.

## Additional Scripts
There are a few additional scripts in package.json which might help get started on building a more robust system. 
1. **Run server tests** - `npm test` - just a placeholder.
2. **Build the server distribution** - `npm run build` - 
This will prepare a distribution more suitable for light production usage. 
3. **Run the production server** - `npm run serve` - 
This runs the latest distribution server.

## Run Time Dependencies

| **Dependency**              | **Use**                                                                    |
| --------------------------- | -------------------------------------------------------------------------- |
| chalk                       | Colorizes console output                                                   |
| cross-env                   | Handles environmental variables in a corss-platform friendly way           |
| express                     | Provides server routing and middleware framework                           |
| jswebtoken                  | Provides JSON web token verification                                       |

## Development Dependencies

| **Dependency**              | **Use**                                                                    |
| --------------------------- | -------------------------------------------------------------------------- |
| babel-cli                   | Provides command line interface                                            |
| babel-preset-env            | Provides babel preset environments                                         |
| babel-register              | Registers tests for transpiling                                            |
| chai                        | Adds assertions for test                                                   |
| jsdom                       | Provides in-memory DOM for testing                                         |
| mocha                       | Tests JavaScript                                                           |
| npm-run-all                 | Displays results of multiple commands on single command line               |
| nsp                         | Provides node security checks                                              |
| rimraf                      | Removes files and directories for cleanup                                  |
