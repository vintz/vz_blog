export var GenerateRandomString = (length: number): string =>
{
    var result = '';
    var data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var idx = 0; idx <= length; idx++)
    {
        var rdIdx = Math.floor(Math.random() * data.length);
        result += data[rdIdx];
    }
    return result;
}