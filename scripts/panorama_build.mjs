// https://github.com/fabiospampinato/watcher

import { createRequire } from 'module'
const require = createRequire(import.meta.url);

import Watcher from 'watcher';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const path = require("path");
const utils = require("./utils");
const rollup = require("rollup");
const glob = require("glob");
const spawn = require('child_process').spawn;
const fs = require("fs-extra");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function GetSourceAndTargetPathFromAbsolutePath(pathToFile)
{
	let srcPath = pathToFile.replace("scripts\\temp\\", ".\\scripts\\temp\\").replace(/\\/g,'/');	
	let targetPath = srcPath.replace("scripts/temp/panorama/", "content/panorama/scripts/custom_game/");	
	const basePath = path.resolve(".").replace(/\\/g,'/') + "/";
	srcPath = srcPath.replace(basePath, "");
	targetPath = targetPath.replace(basePath, "");
	return [srcPath, targetPath];
}

function GetSourceAndTargetPathForLegacyPanorama()
{
	const panoramaSrcDirectory = path.resolve(__dirname, "../src/panorama/");
	const panoramaTargetDirectory = path.resolve(__dirname, "../content/panorama/scripts/custom_game/");
	return [panoramaSrcDirectory, panoramaTargetDirectory];
}

function buildPanoramaScript(src)
{
	const paths = GetSourceAndTargetPathFromAbsolutePath(src);
	const srcPath = paths[0];
	const targetPath = paths[1];
	
	const args = [
		"./node_modules/rollup/dist/bin/rollup",
		"--input",
		srcPath,
		"-f",
		"iife",
		"--file",
		targetPath
	];
	// node ./node_modules/rollup/dist/bin/rollup --input ./scripts/temp/panorama/quests/quests_markers.js -f iife --file ./content/panorama/scripts/custom_game/quests/quests_markers.js
	utils.runScript("node", args, function(stdout, stderr, exitCode) {
		if(exitCode != 0)
		{
			utils.print("error", stderr);
		}
	});
}

const walk = (dir, files = []) => {
    const dirFiles = fs.readdirSync(dir)
    for (const f of dirFiles) {
        const stat = fs.lstatSync(dir + path.sep + f)
        if (stat.isDirectory()) {
            walk(dir + path.sep + f, files)
        } else {
			
            files.push(dir + path.sep + f)
        }
    }
    return files
}

function buildPanorama()
{	
	const filePaths = walk(path.resolve(".\\scripts\\temp\\panorama"));
	const jsFilePaths = [];
	
	filePaths.forEach(function(filePath) {
		if(path.extname(filePath) == ".js")
		{
			jsFilePaths.push(path.resolve(__dirname, filePath));
		}
	});
	
	jsFilePaths.forEach(function(filePath){
		buildPanoramaScript(filePath);
	});
	
	// Legacy panorama
	const paths = GetSourceAndTargetPathForLegacyPanorama();
	const panoramaSrcDirectory = paths[0];
	const panoramaTargetDirectory = paths[1];
	utils.copyRecursiveSyncByExtension(panoramaSrcDirectory, panoramaTargetDirectory, ".js");
}

function PanoramaTsWatcherAction(filePath)
{
	try 
	{
		buildPanoramaScript(filePath);	
	} 
	catch(error) 
	{
		utils.print("error", error);
	}	
}

function PanoramaLegacyWatcherAction(filePath)
{
	if(path.extname(filePath) != ".js")
	{
		return;
	}
		
	try 
	{
		const paths = GetSourceAndTargetPathForLegacyPanorama();
		const panoramaSrcDirectory = paths[0];
		const panoramaTargetDirectory = paths[1];		
		const relativePath = filePath.replace(panoramaSrcDirectory, "");
		const srcPath = panoramaSrcDirectory + relativePath;
		const targetPath = panoramaTargetDirectory + relativePath;
						
		fs.copySync(srcPath, targetPath, { overwrite : true, errorOnExist: true});
	} 
	catch(error) 
	{
		utils.print("error", error);
	}	
}

function initPanoramaWatchers()
{
	const panoramaTsWatcher = new Watcher ("./scripts/temp/panorama/", { recursive: true });
	panoramaTsWatcher.on("change", filePath => {
		PanoramaTsWatcherAction(filePath);		
	});
	panoramaTsWatcher.on("add", filePath => {
		PanoramaTsWatcherAction(filePath);		
	});
	const panoramaLegacyWatcher = new Watcher ("./src/panorama/", { recursive: true });
	panoramaLegacyWatcher.on("change", filePath => {
		PanoramaLegacyWatcherAction(filePath);
	});
	panoramaLegacyWatcher.on("add", filePath => {
		PanoramaLegacyWatcherAction(filePath);
	});
}

(async () => {
	const args = process.argv.slice(2);
	const workMode = args[0];
	
	if(workMode == "release")
	{
		buildPanorama();
		return;
	}
	if(workMode == "dev-watch")
	{
		initPanoramaWatchers();
		return;
	}
	throw new Error("Unknown work mode!");
})().catch(error => {
	utils.print("error", error);
	process.exit(1);
});