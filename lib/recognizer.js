'use strict'

var gm = require('gm').subClass({imageMagick:true});
var tesseract = require('node-tesseract');
var uuid = require('node-uuid');
var fs = require('fs');
var tmpdir = require('os').tmpdir();
var path = require('path');
var util = require('util');

var Recognizer = {

    tmpFiles: [],

    COLOR_SPACE:'GRAY',

    process: function(image, options, callback) {

	if (typeof options === 'function') {
	    callback = options;
	    options = null;
	}
	
	// generate output file name to store @param {String} image in .tiff format
	var tiff = path.resolve(tmpdir, util.format('node-captcha-%s.tiff', uuid.v4()));
	
	// add the tmp file to the list
	Recognizer.tmpFiles.push(tiff);

	var wrappedCallback = function(error, text) {

	    var index = Recognizer.tmpFiles.indexOf(tiff);
            if (~index) Recognizer.tmpFiles.splice(index, 1);

            fs.unlink(tiff);

	    callback(error, text);
	};

	gm(image).colorspace(Recognizer.COLOR_SPACE).write(tiff, function(error) {
	    if(error) {
		wrappedCallback(error, null);
		return;
	    }
	    tesseract.process(tiff, options, wrappedCallback);
	});
    }
}


function gc() {
    for (var i = Recognizer.tmpFiles.length - 1; i >= 0; i--) {
	try {
	    fs.unlinkSync(Recognizer.tmpFiles[i]);
	} catch (err) {}

	var index = Recognizer.tmpFiles.indexOf(Recognizer.tmpFiles[i]);
	if (~index) Recognizer.tmpFiles.splice(index, 1);
    };
}

// clean up the tmp files
process.addListener('exit', function _exit(code) {
    gc();
});

module.exports.process = Recognizer.process;
