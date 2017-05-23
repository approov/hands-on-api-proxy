#!/usr/bin/env node

console.log('Hands On API Proxy Configuration');

var chalk = require('chalk');
var program = require('commander');
var path = require('path');
var fs = require('fs-extra');
var yaml = require('js-yaml');
var url = require('url');
var selfsigned = require('selfsigned');

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
    if (proxyUrl.protocol == null) {
        proxyUrl.protocol = 'http:';
    }
    if (proxyUrl.port == null) {
        proxyUrl.port = 80;
    }
    var proxyHome = url.format(proxyUrl);
    var proxyPort = proxyUrl.port;

    var proxySSLUrl = url.parse(doc.proxy_home, false, true);
    proxySSLUrl.protocol = 'https:';
    var proxySSLHome = url.format(proxySSLUrl);
    var proxySSLPort = proxySSLUrl.port;
    
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
    var androidSSLPath = '/app/src/main/assets/';

    var penPath = '../pen/';

    var clientDir = '';
    var clientResDir = '';
    var clientLibDir = '';
    var clientLibName = `approov.aar`;
    var clientSSLDir = '';

    var nodeProxyPath = '../steps/proxy/node/';
    var nodeSrcPath = '/src/';

    var proxyDir = '';
    var proxySrcDir = '';

    // generate proxy pki material

    var attrs = [{ name: 'commonName', value: 'example.com' }];
    // note adding subjectAltName to extensions options, but somewhat problematic
    var pems = selfsigned.generate(attrs, { days: 365 });

    console.log('-- generated self-signed certificate');

    // write step 0_direct-client

    clientDir = '0_direct-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;

    fs.ensureDirSync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + nasaProtocol + '//' + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    fs.ensureDirSync(clientResDir);
    fs.writeFileSync(clientResDir + 'secrets.xml',
        '<resources>\n' +
        '    <string name=\"api_key\">' + doc.nasa_api_key + '</string>\n' +
        '</resources>\n'
    );

    // write step 1_open-client

    clientDir = '1_open-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;

    fs.ensureDirSync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + proxyHome + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    // write step 2_secure-client

    clientDir = '2_secure-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;

    fs.ensureDirSync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + proxyHome + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    fs.ensureDirSync(clientLibDir);
    fs.copySync(doc.approov_android_lib, path.join(clientLibDir, clientLibName));

    // write step 4_pinned-client

    clientDir = '4_pinned-client';
    clientResDir = androidClientPath + clientDir + androidResPath;
    clientLibDir = androidClientPath + clientDir + androidLibPath;
    clientSSLDir = androidClientPath + clientDir + androidSSLPath;

    fs.ensureDirSync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + proxySSLHome + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    fs.ensureDirSync(clientLibDir);
    fs.copySync(doc.approov_android_lib, path.join(clientLibDir, clientLibName));

    fs.ensureDirSync(clientSSLDir);
    fs.writeFileSync(clientSSLDir + 'cert.pem', pems.cert);

    // write step 1_open-proxy
    
    proxyDir = '1_open-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    fs.ensureDirSync(proxySrcDir);
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

    fs.ensureDirSync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '};\n'
    );

    // write step 2_secure-proxy
    
    proxyDir = '2_secure-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    fs.ensureDirSync(proxySrcDir);
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
        '        ' + false + ',\n' +
        '};\n'
    );

    fs.ensureDirSync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '    approov_token_secret:   /* token secret received from Approov demo download */\n' +
        '        \'' + doc.approov_token_secret + '\',\n' +
        '};\n'
    );

    // write step 3_enhanced-proxy
    
    proxyDir = '3_enhanced-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    fs.ensureDirSync(proxySrcDir);
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
        '        ' + false + ',\n' +
        '};\n'
    );

    fs.ensureDirSync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '    approov_token_secret:   /* token secret received from Approov demo download */\n' +
        '        \'' + doc.approov_token_secret + '\',\n' +
        '};\n'
    );

    // write step 4_pinned-proxy
    
    proxyDir = '4_pinned-proxy';
    proxySrcDir = nodeProxyPath + proxyDir + nodeSrcPath;

    fs.ensureDirSync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'config.js',
        'module.exports = {\n' +
        '    proxy_port:             /* port the proxy listens on */\n' +
        '        ' + proxySSLPort + ',\n' +
        '    nasa_host:              /* NASA API host */\n' +
        '        \'' + nasaHostname + '\',\n' +
        '    nasa_protocol:          /* NASA API protocol */\n' +
        '        \'' + nasaProtocol + '\',\n' +
        '    approov_header:         /* Approov header name */\n' +
        '        \'' + 'approov' + '\',\n' +
        '    approov_enforcement:    /* set true to enforce token checks */\n' +
        '        ' + false + ',\n' +
        '};\n'
    );

    fs.ensureDirSync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '    approov_token_secret:   /* token secret received from Approov demo download */\n' +
        '        \'' + doc.approov_token_secret + '\',\n' +
        '};\n'
    );

    fs.ensureDirSync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'cert.pem', pems.cert);
    fs.writeFileSync(proxySrcDir + 'key.pem', pems.private);

    // write pen/client (0_direct-client)

    clientDir = 'client';
    clientResDir = penPath + clientDir + androidResPath;
    clientLibDir = penPath + clientDir + androidLibPath;

    fs.ensureDirSync(clientResDir);
    fs.writeFileSync(clientResDir + 'config.xml',
        '<resources>\n' +
        '    <string name=\"api_url\">' + nasaProtocol + '//' + nasaHostname + '</string>\n' +
        '</resources>\n'
    );

    fs.ensureDirSync(clientResDir);
    fs.writeFileSync(clientResDir + 'secrets.xml',
        '<resources>\n' +
        '    <string name=\"api_key\">' + doc.nasa_api_key + '</string>\n' +
        '</resources>\n'
    );

    // write pen/proxy (1_open-proxy)
    
    proxyDir = 'proxy';
    proxySrcDir = penPath + proxyDir + nodeSrcPath;

    fs.ensureDirSync(proxySrcDir);
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

    fs.ensureDirSync(proxySrcDir);
    fs.writeFileSync(proxySrcDir + 'secrets.js',
        'module.exports = {\n' +
        '    nasa_api_key:           /* api key received from NASA */\n' +
        '        \'' + doc.nasa_api_key + '\',\n' +
        '};\n'
    );

    console.log('-- configuration complete');
}

// end of file
