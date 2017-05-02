"use strict";
const enginefactory_1 = require('./lib/engine/enginefactory');
enginefactory_1.EngineFactory.CreateEngine((err, engine) => {
    if (err) {
        console.log(err);
    }
});
