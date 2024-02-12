const path = require("path");
const utils = require("./utils");
const fs = require("fs");

(async () => {
	const vscriptsSrcDirectory = path.resolve(__dirname, "../src/vscripts/");
	const vscriptsTargetDirectory = path.resolve(__dirname, "../game/scripts/vscripts/");
	
	utils.copyRecursiveSyncByExtension(vscriptsSrcDirectory, vscriptsTargetDirectory, ".lua", (src, dest) => {
		if(!fs.existsSync(dest)) {
			fs.copyFileSync(src, dest);
		}
	}); 
})().catch(error => {
	utils.print("error", error);
    process.exit(1);
});