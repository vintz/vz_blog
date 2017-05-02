import {EngineFactory} from './lib/engine/enginefactory';

EngineFactory.CreateEngine((err,engine)=>
{
    if (err)
    {
        console.log(err);
    }
});