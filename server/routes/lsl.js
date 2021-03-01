var express = require('express');
const axios = require('axios');
const lsl = require('node-lsl');
var router = express.Router();

const TIMEOUT = 10000; //Timeout for inactive lsl stream

var streamInfo = null;
var streamInlet = null;
var queue = [];

//Endpoint to query list of available lsl devices
//Query headset to get channMake sure channel counts line up
router.get("/getStreams", function(req, res, next) {
    const streams = lsl.resolve_byprop('type', 'EEG'); //TODO: Identify correct LSL stream
    var streamNames = [];
    for (var i = 0; i < streams.length; i++) {
        streamNames.push(streams[i].getName());
    }
    res.send(JSON.stringify({'streams': streamNames}));
});

router.get("/connect/:streamName", function(req, res, next) {
    var streamName = req.params["streamName"];
    streamInfo = lsl.resolve_byprop('name', streamName)[0];

    console.log('Connecting...');
    streamInlet = new lsl.StreamInlet(streamInfo);
    streamInlet.streamChunks(1, TIMEOUT, 1);
    console.log('Connected');

    streamInlet.on('chunk', (data) => {
        queue.push(data);
    });

    streamInlet.on('closed', () => {
        // streamInfo = null;
        // streamInlet = null;
        // queue = [];

        console.log("Stream Closed");
    });
    
    res.send("Connected Successfully");
});

router.get("/getData", function(req, res, next) {
    if (queue.length <= 0) {
        var result = JSON.stringify({"score": 0, "timestamp": -1});
        res.send(result);
        return;
    }
    var focus_sample = queue.splice(0,1)[0];
    var score = focus_sample.data[0];
    var time = focus_sample.timestamps[0] / 1000;
    console.log("Server sending score: " + score + " and time: " + time);
    var update = JSON.stringify({"score": score, "timestamp": time});
    res.send(update);
});

router.get("/stop", function(req, res, next) {
    console.log("Stopping...")
    if (streamInlet != null) {
        // streamInlet.close();
        // streamInfo = null;
        // streamInlet = null;
        // focus_queue = [];
        console.log("Stopped LSL");
    }
    res.send("Stopped");
});

module.exports = router;