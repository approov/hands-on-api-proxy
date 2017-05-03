#!/usr/bin/env node

console.log('Hands On API Proxy Configuration');

var chalk = require('chalk');
var program = require('commander');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var cpx = require('cpx');
var yaml = require('js-yaml');
var url = require('url');

var configFilename = 'secrets.yaml';

// handle command line

program
    .version('1.0.0')
    .parse(process.argv);

out: {
    // parse and check secrets file

    if (!fs.existsSync(configFilename)) {
        console.log(chalk.red('\nERROR: missing ' + configFilename + ' configuration file\n'));
        break out;
    }
    try {
        var doc = yaml.safeLoad(fs.readFileSync(configFilename, 'utf8'));
    } catch (e) {
        console.log(chalk.red('\nERROR: ' + configFilename + ': ' + e.message + '\n'));
        break out;
    }

    if (doc.proxy_home == null) {
        console.log(chalk.red('\nERROR: missing proxy_home in ' + configFilename + ' configuration file\n'));
        break out;
    }
    var proxyUrl = url.parse(doc.proxy_home, false, true);
    if (proxyUrl.hostname == null) {
        console.log(chalk.red('\nERROR: failed to find hostname in proxy_home in ' + configFilename + ' configuration file\n' +
                                `       specify proxy_home as <protocol>://<hostname>:<port>/<path>\n`));
        break out;
    }
    if (proxyUrl.search != null) {
        console.log(chalk.red('\nERROR: query strings not allowed in proxy_home in ' + configFilename + ' configuration file\n' +
                                `       specify proxy_home as <protocol>://<hostname>:<port>/<path>\n`));
        break out;
    }
    console.log('protocol:', proxyUrl.protocol);
    if (proxyUrl.protocol == null) {
        proxyUrl.protocol = 'http:';
    }
    if (proxyUrl.port == null) {
        proxyUrl.port = 80;
    }
    var proxyHome = url.format(proxyUrl);
    var proxyPort = proxyUrl.port;
    
    if (doc.nasa_api_key == null) {
        console.log(chalk.red('\nERROR: missing nasa_api_key in ' + configFilename + ' configuration file\n'));
        break out;
    }

    if (doc.approov_token_secret == null) {
        console.log(chalk.red('\nERROR: missing approov_token_secret in ' + configFilename + ' configuration file\n'));
        break out;
    }

    if (doc.approov_android_lib == null) {
        console.log(chalk.red('\nERROR: missing approov_android_lib in ' + configFilename + ' configuration file\n'));
        break out;
    }
    if (!fs.existsSync(doc.approov_android_lib)) {
        console.log(chalk.red('\nERROR: approov android library not found at ' + doc.approov_android_lib + '\n'));
        break out;
    }
    if (path.basename(doc.approov_android_lib) != 'approov.aar') {
        console.log(chalk.red('\nERROR: approov android library must be named approov.aar\n'));
        break out;
    }

    var nasaHostname = 'api.nasa.gov';
    var nasaProtocol = 'https:';

    // initialize path components

    var androidClientPath = '../steps/client/android/';
    var androidResPath = '/app/src/main/res/values/';
    var androidLibPath = '/approov/';

    var clientDir = '';
    var clientResDir = '';
    var clientLibDir = '';

    var nodeProxyPath = '../steps/proxy/node/';
    var nodeSrcPath = '/src/';

    var proxyDir = '';
    var proxySrcDir = '';

    // write step 0_starting-client

    clientDir = '0_starting-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;

    mkdirp.sync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + nasaProtocol + '//' + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    mkdirp.sync(clientResDir);
    fs.writeFileSync(clientResDir + 'secrets.xml',
        '<resources>\n' +
        '    <string name=\"api_key\">' + 'NASA_API_KEY_STRING' + '</string>\n' +
        '</resources>\n'
    );

    // write step 1_direct-client

    clientDir = '1_direct-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;

    mkdirp.sync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + nasaProtocol + '//' + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    mkdirp.sync(clientResDir);
    fs.writeFileSync(clientResDir + 'secrets.xml',
        '<resources>\n' +
        '    <string name=\"api_key\">' + doc.nasa_api_key + '</string>\n' +
        '</resources>\n'
    );

    // write step 2_open-client

    clientDir = '2_open-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;

    mkdirp.sync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + proxyHome + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    // write step 3_secure-client

    clientDir = '3_secure-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;

    mkdirp.sync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + proxyHome + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    mkdirp.sync(clientLibDir);
    cpx.copySync(doc.approov_android_lib, clientLibDir, { clean: true });

    // write step 0_starting-proxy
    
    proxyDir = '0_starting-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'config.js',
        'module.exports = {\n' +
        '    proxy_port:             /* port the proxy listens on */\n' +
        '        ' + proxyPort + ',\n' +
        '    nasa_host:              /* NASA API host */\n' +
        '        \'' + nasaHostname + '\',\n' +
        '    nasa_protocol:          /* NASA API protocol */\n' +
        '        \'' + nasaProtocol + '\',\n' +
        '};\n'
    );

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + 'NASA_API_KEY_STRING' + '\',\n' +
        '};\n'
    );

    // write step 2_open-proxy
    
    proxyDir = '2_open-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'config.js',
        'module.exports = {\n' +
        '    proxy_port:             /* port the proxy listens on */\n' +
        '        ' + proxyPort + ',\n' +
        '    nasa_host:              /* NASA API host */\n' +
        '        \'' + nasaHostname + '\',\n' +
        '    nasa_protocol:          /* NASA API protocol */\n' +
        '        \'' + nasaProtocol + '\',\n' +
        '};\n'
    );

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '};\n'
    );

    // write step 3_secure-proxy
    
    proxyDir = '3_secure-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'config.js',
        'module.exports = {\n' +
        '    proxy_port:             /* port the proxy listens on */\n' +
        '        ' + proxyPort + ',\n' +
        '    nasa_host:              /* NASA API host */\n' +
        '        \'' + nasaHostname + '\',\n' +
        '    nasa_protocol:          /* NASA API protocol */\n' +
        '        \'' + nasaProtocol + '\',\n' +
        '    approov_header:         /* Approov header name */\n' +
        '        \'' + 'approov' + '\',\n' +
        '    approov_enforcement:    /* set true to enforce token checks */\n' +
        '        ' + true + ',\n' +
        '};\n'
    );

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '    approov_token_secret:   /* token secret received from Approov demo download */\n' +
        '        \'' + doc.approov_token_secret + '\',\n' +
        '};\n'
    );

    // write step 4_enhanced-proxy
    
    proxyDir = '4_enhanced-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'config.js',
        'module.exports = {\n' +
        '    proxy_port:             /* port the proxy listens on */\n' +
        '        ' + proxyPort + ',\n' +
        '    nasa_host:              /* NASA API host */\n' +
        '        \'' + nasaHostname + '\',\n' +
        '    nasa_protocol:          /* NASA API protocol */\n' +
        '        \'' + nasaProtocol + '\',\n' +
        '    approov_header:         /* Approov header name */\n' +
        '        \'' + 'approov' + '\',\n' +
        '    approov_enforcement:    /* set true to enforce token checks */\n' +
        '        ' + true + ',\n' +
        '};\n'
    );

    mkdirp.sync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '    approov_token_secret:   /* token secret received from Approov demo download */\n' +
        '        \'' + doc.approov_token_secret + '\',\n' +
        '};\n'
    );

    console.log('step configuration complete');
}

// end of file
