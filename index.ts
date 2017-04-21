import * as child_process from 'child_process';

var fork = child_process.fork;

var args = [];
process.argv.forEach((val, index, array) => {
    if (index > 1)
    {
        args.push(val);
    }
});


var relaunch = (args) => 
{
    var child = fork('./blog', args);

    child.on('exit', function (code) 
    {   
        if (code == 1)
        { 
            relaunch(args);
        }
    });
}

relaunch(args);
