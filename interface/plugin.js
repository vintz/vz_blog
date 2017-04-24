"use strict";
(function (PluginType) {
    PluginType[PluginType["PostsDataAccess"] = 0] = "PostsDataAccess";
    PluginType[PluginType["CommentsDataAccess"] = 1] = "CommentsDataAccess";
})(exports.PluginType || (exports.PluginType = {}));
var PluginType = exports.PluginType;
class Pluggable {
}
exports.Pluggable = Pluggable;
class PluginEntryDataType {
}
exports.PluginEntryDataType = PluginEntryDataType;
