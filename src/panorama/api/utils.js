/* eslint-disable no-undef */
"use strict";

var Utils = {};

Utils.GetPlayerColor = function (pid) {
    var playerColor = Players.GetPlayerColor(pid).toString(16);
    return playerColor == null
        ? "#000000"
        : "#" + playerColor.substring(6, 8) + playerColor.substring(4, 6) + playerColor.substring(2, 4) + playerColor.substring(0, 2);
};

Utils.FormatBigNumber = function (num, digits) {
    if (!digits) {
        digits = 2;
    }
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup
        .slice()
        .reverse()
        .find(function (item) {
            return num >= item.value;
        });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
};

Utils.Round = function (num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

Utils.FormatTime = function (duration) {
    // Hours, minutes and seconds
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
};

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

Utils.ReplaceAll = function (str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
};

GameUI.CustomUIConfig().Utils = Utils;
