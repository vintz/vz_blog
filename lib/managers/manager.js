"use strict";
const fs = require('fs');
const path = require('path');
class Manager {
    constructor(path, baseFileName, error) {
        this.path = path;
        this.baseFileName = baseFileName;
        this.error = error;
    }
    Init() {
        this.purgeContent();
        var files = fs.readdirSync(this.path);
        if (files && files.length <= 0) {
            return this.error;
        }
        else {
            for (var key in files) {
                var currentDirectory = path.join(this.path, files[key]);
                if (fs.lstatSync(currentDirectory).isDirectory()) {
                    var filename = path.join(currentDirectory, this.baseFileName);
                    if (fs.existsSync(filename)) {
                        this.addContent(currentDirectory);
                    }
                }
            }
            return null;
        }
    }
}
exports.Manager = Manager;
