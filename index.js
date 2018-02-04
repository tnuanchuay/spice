const puppeteer = require('puppeteer');
const config = require('./config.js');
const sha1 = require('sha1');
const path = require('path');
const express = require('express');
const Connection = require('puppeteer/lib/Connection').Connection;
const WebSocket = require('ws');

var app = express();
var server = require('http').Server(app);
var state = [];

app.use(express.static('static'));

app.get("/new", async (req, res) => {
    const browser = await puppeteer.launch({headless:false});
    browser.disconnect();

    const bwendpoint = browser.wsEndpoint();
    const internalws = new WebSocket(bwendpoint);

    const pxpath = `/wd/${sha1(bwendpoint)}`;
    const wss = new WebSocket.Server({ port:12345, path:pxpath });

    wss.on('connection', (ws, req) => {
        ws.on('message', (msg) => {
            const jsonmsg = JSON.parse(msg);
            console.log("->", jsonmsg.method, jsonmsg.params);
            internalws.send(msg);
        })

        internalws.on('message', (msg) => {
            const jsonmsg = JSON.parse(msg);
            console.log("<-", msg);
            ws.send(msg)
        })

        wss.on('disconnect', () => {
            
        });
    });

    console.log(`create new ${bwendpoint} endpoint = ${pxpath}`);

    const newState = {
        endpoint : bwendpoint,
        instance : browser,
        iopath:pxpath
    }

    state.push(newState);

    res.json({
        path:pxpath
    }).end();
});

server.listen(config.http.port, () => {
    // console.log(`socket.io path : ${io.path()}`);
    console.log(`listening on : ${config.http.port}`);
});