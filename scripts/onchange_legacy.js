const fs = require("fs-extra");
const path = require("path");
const utils = require("./utils");
const execSync = require('child_process').execSync;
	
function GetSourceAndTargetPathFromRelativePath(relativePathToFile, isPanorama)
{
	const relativeDirectory = path.dirname(relativePathToFile)
	const fileName = path.basename(relativePathToFile);
	const srcPath = path.resolve(path.resolve(__dirname, "..\\" + relativeDirectory), fileName);
	
	const indexOfSlash = relativePathToFile.indexOf("\\");
	const targetRelativePath = relativePathToFile.slice(indexOfSlash);
	
	let targetPath = "";
	
	if(isPanorama)
	{
		let fixedTargetRelativePath = targetRelativePath.replace("\\panorama\\", "\\panorama\\scripts\\custom_game\\");
		targetPath = path.join(__dirname, "../content/", fixedTargetRelativePath);
	} else {
		targetPath = path.join(__dirname, "../game/scripts/", targetRelativePath);
	}
	
	return [srcPath, targetPath];
}

function MoveVScript(relativePathToFile)
{
	const fileName = path.basename(relativePathToFile);
	utils.print("success", "VScript " + fileName + " compilation started...");
	execSync('npm run release:vscripts-release-build', {
	  cwd: path.resolve(__dirname, "../")
	}, function(error, stdout, stderr) {
		if(error) {
			throw new Error(Buffer.from(error, 'utf-8').toString());
		}
		if(stdout) {
			utils.print("log", Buffer.from(stdout, 'utf-8').toString());
		}
		if(stderr) {
			throw new Error(Buffer.from(error, 'utf-8').toString());
		}
	});
	utils.print("success", "VScript " + fileName + " updated! Use script_reload in game.");
}

function MovePanoramaScript(relativePathToFile)
{
	const paths = GetSourceAndTargetPathFromRelativePath(relativePathToFile, true);
	const srcPath = paths[0];
	const targetPath = paths[1];
	fs.copySync(srcPath, targetPath, { overwrite : true, errorOnExist: true});
}

(async () => {
	// src\vscripts\game_difficulty.lua   vscripts
	const args = process.argv.slice(2);
	const pathToChangedFile = args[0];
	const projectType = args[1];
		
	switch (projectType) {
	  case 'vscripts':
		MoveVScript(pathToChangedFile);
		break;
	  case 'panorama':
		MovePanoramaScript(pathToChangedFile);
		break;
	  default:
		throw new Error("Unknown project type: '" + projectType +"'");
	}
})().catch(error => {
	utils.print("error", error);
    process.exit(1);
});