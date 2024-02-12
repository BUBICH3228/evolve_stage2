const fs = require("fs-extra");
const path = require("path");
const utils = require("./utils");
const { getAddonName, getDotaPath } = require("./utils");
const { spawn } = require("child_process");

const directoriesToExcludeInAssets = ["maps"]; // so fucking long...

function CapitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

let assetsCompilationState = {};

function TryPrintResults()
{
	for (const [key, value] of Object.entries(assetsCompilationState)) {
		if(value.msg == undefined)
		{
			return;
		}
	}
	
	let isThereAreWarnings = false;
	
	for (const [key, value] of Object.entries(assetsCompilationState)) {
		if(value.error)
		{
			utils.print("error", value.msg);
			writeLogsForDirectory(value.fullError, value.directory);
			utils.print("error", "Build failed!");
			process.exit(1);
		} else 
		{
			const stats = value.stats;
			const compiledFiles = stats[0];
			const failedFiles = stats[1];
			const skippedFiles = stats[2];
			const timeTaken = stats[3];
			const compilationState = stats[4];
			const compilationResult = stats[5];
			if(compilationState == "OK")
			{
				utils.print("success", value.msg);
				utils.print("success", compilationResult); 
			} else {
				if(compilationState == "WARNING")
				{
					utils.print("warning", "There are issues with compilation of " + value.name + " directory!");
					utils.print("warning", compilationResult);
					writeLogsForDirectory(value.stdout, value.directory);
					isThereAreWarnings = true;
				} else 
				{
					utils.print("error", "Failed to compile " + value.name + " directory!");
					utils.print("error", "Build failed!");
					writeLogsForDirectory(value.stdout, value.directory);
					process.exit(1);
				}
			}
		}
	}
	if(isThereAreWarnings)
	{
		utils.print("warning", "Build finished with warnings!");
	} else {
		utils.print("success", "Build finished!");
	}
}

function writeLogsForDirectory(logs, directory)
{
	const pathToFile = path.resolve("./scripts/temp/release/" + directory + "_logs.txt");
	utils.print("log", "Check compilation logs in:");
	utils.print("log", pathToFile);
	fs.writeFileSync(
		pathToFile,
		logs,
		'utf-8');
}

function getCompileTimeStats(data)
{
	const seperator = "-----------------------------------------------------------------";
	const statsStringStartIndex = data.indexOf(seperator);
	const statsStringEndIndex = data.indexOf(seperator, statsStringStartIndex + 1);
	let statsString = data.slice(statsStringStartIndex + seperator.length, statsStringEndIndex);
	statsString = statsString.replace(/(\r\n|\n|\r)/gm, "");
	statsString = statsString.trim();
	let rx = /\S*\d+\S*/g;
	let result = statsString.match(rx) || ["0", "0", "0", "0m:00s", "WARNING"];
	
	let indexOfDoubleDots = statsString.indexOf(":");
	let state = statsString.slice(0, indexOfDoubleDots);
	result.push(state);
	result.push(statsString);
	return result;
}

(async () => {
	const dotaPath = await getDotaPath();
	const addonName = await getAddonName();
	const pathToGameInfo = path.resolve(dotaPath, "./game/bin");
	const pathToResourceCompilerWorkingDirectory = path.resolve(dotaPath, "./game/bin/win64/");
	const pathToResourceCompiler = path.resolve(pathToResourceCompilerWorkingDirectory, "./resourcecompiler.exe");
	const pathToAssets = path.resolve(dotaPath, "./content/dota_addons/" + addonName);
	
	const assetsDirectories = fs.readdirSync(pathToAssets, { withFileTypes: true })
		.filter((item) => item.isDirectory() && !directoriesToExcludeInAssets.includes(item.name))
		.map((item) => item.name);

	for(const assetDirectory of assetsDirectories)
	{
		assetsCompilationState[assetDirectory] = {};
	}
	
	for(const assetDirectory of assetsDirectories)
	{
		const assetsPath = path.resolve(pathToAssets, assetDirectory) + "\\*";
		const args = ["-game", pathToGameInfo, "-v", "-i", assetsPath, "-r"]; // ["-game", pathToGameInfo, "-v", "-pauseiferror", "-i", assetsPath, "-r"];
		
		utils.runScript(pathToResourceCompiler, args, function(stdout, stderr, exitCode) {
			if(exitCode == 0) {
				assetsCompilationState[assetDirectory] = {
					msg: CapitalizeFirstLetter(assetDirectory) + " directory compiled succesfully!",
					error: false,
					stdout: stdout,
					stats: getCompileTimeStats(stdout),
					name: CapitalizeFirstLetter(assetDirectory),
					directory: assetDirectory
				}
			} else {
				assetsCompilationState[assetDirectory] = {
					msg: "Failed to compile " + CapitalizeFirstLetter(assetDirectory) + " directory!",
					name: CapitalizeFirstLetter(assetDirectory),
					error: true,
					stdout: stdout,
					fullError: stdout + "\r\n" + stderr,
					directory: assetDirectory
				}
			}
			TryPrintResults();
		}, pathToResourceCompilerWorkingDirectory);
	}
})().catch(error => {
	utils.print("error", error);
    process.exit(1);
});