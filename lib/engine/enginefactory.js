"use strict";
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const lokidata_1 = require('../data/lokidata');
const standard_1 = require('./standard');
const install_1 = require('./install');
class BlogEngineFactory {
    constructor() {
    }
    CreateEngine(done) {
        var engine;
        var dataAccess = new lokidata_1.LokiDataAccess();
        dataAccess.Init({ 'dbfile': 'db.json' }, (err) => {
            if (err) {
                done(err, null);
            }
            else {
                if (dataAccess.CountUsers() <= 0) {
                    engine = new install_1.InstallerBlogEngine(dataAccess, () => {
                        done(null, engine);
                    });
                }
                else {
                    engine = new standard_1.StandardBlogEngine(dataAccess, () => {
                        done(null, engine);
                    });
                }
            }
        });
    }
}
exports.EngineFactory = new BlogEngineFactory();
