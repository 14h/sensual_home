const fs = require('fs');
const https = require('https');
const http = require('http');

const key = fs.readFileSync('cert/shc-bcx-key.pem');
const cert = fs.readFileSync('cert/shc-bcx-cert.pem');



const options = {
    hostname: '100.100.197.181',
    port: 8444,
    path: '/smarthome/devices/hdm:PhilipsHueBridge:HueLight_0017880100ca5d42-0b_001788258049/services/HSBColorActuator/state',
    method: 'GET',
    strictSSL: false,
    key: key,
    cert: cert,
    rejectUnauthorized: false,
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify({"@type": "colorState","rgb": '#FFFFFF'}).length
    }
};

const parseReqURL = (url) => {
    if(url.length > 7) {
        return null;
    }

    return url.substring(1);
};

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*')
    const color = parseReqURL(req.url);
    // if(!color) {
    //     res.end('please provide a valid color format! e.g: /FFFFFF');
    // }




    if(!color) {
        res.end('');
        return;
    }
    const request = https.request(options, function(res) {
        res.on('data', function(data) {
            process.stdout.write(data);
        });
        res.on('err', console.log)
    });

    console.log('color.', color, !color,  parseInt(`0x${color}`));

    const body = JSON.stringify({
        "@type": "colorState",
        "rgb": parseInt(`0x${color}`)
    });

    request.write(body);

    request.end();
    res.end('Success!');
});

server.listen(3001, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:3001/`);
});

