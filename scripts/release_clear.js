const fs = require("fs-extra");
const path = require("path");
const utils = require("./utils");

(async () => {
	fs.emptyDirSync(path.resolve(__dirname, "../content/panorama/scripts/custom_game/"));
	fs.emptyDirSync(path.resolve(__dirname, "../game/scripts/vscripts/"));
})().catch(error => {
	utils.print("error", error);
    process.exit(1);
});