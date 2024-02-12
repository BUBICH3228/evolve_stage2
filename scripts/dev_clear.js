const fs = require("fs-extra");
const path = require("path");
const utils = require("./utils");

(async () => {
	fs.emptyDirSync(path.resolve(__dirname, "./temp/"));
})().catch(error => {
	utils.print("error", error);
    process.exit(1);
});