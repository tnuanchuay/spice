const puppeteer = require('puppeteer');
const config = require('./config.js');
const sha1 = require('sha1');
const path = require('path');
const express = require('express');

var app = express();
var server = require('http').Server(app);
var state = [];

app.use(express.static('static'));

app.get("/new", async (req, res) => {
    const browser = await puppeteer.launch({headless:false});
    const endpoint = browser.wsEndpoint();
    const wdpath = sha1(endpoint);

    const io = require('socket.io')(server, {path:`/wd/${wdpath}`});

    io.on('connection', function (socket) {
        socket.on('message', function (data, d2) {
            browser.connection().send(data, d2);
        });
    });

    const newState = {
        endpoint : endpoint,
        instance : browser,
        iopath:io.path()
    }

    state.push(newState);
    res.json(newState.iopath).end();
});

server.listen(config.http.port, () => {
    // console.log(`socket.io path : ${io.path()}`);
    console.log(`listening on : ${config.http.port}`);
});