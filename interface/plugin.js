"use strict";
(function (PluginType) {
    PluginType[PluginType["PostsDataAccess"] = 0] = "PostsDataAccess";
    PluginType[PluginType["CommentsDataAccess"] = 1] = "CommentsDataAccess";
    PluginType[PluginType["PostParser"] = 2] = "PostParser";
})(exports.PluginType || (exports.PluginType = {}));
var PluginType = exports.PluginType;
class Pluggable {
}
exports.Pluggable = Pluggable;
class PluginEntryDataType {
}
exports.PluginEntryDataType = PluginEntryDataType;
