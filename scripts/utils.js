const { findSteamAppByName, SteamNotFoundError } = require("@moddota/find-steam-app");
const packageJson = require("../package.json");
const fs = require("fs")
const fsExtra = require("fs-extra");
const path = require("path");
const child_process = require('child_process');

// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
// Usage:
// console.log(utils.FgRed, 'sometext', utils.Reset);

const Reset = "\x1b[0m";
const Bright = "\x1b[1m";
const Dim = "\x1b[2m";
const Underscore = "\x1b[4m";
const Blink = "\x1b[5m";
const Reverse = "\x1b[7m";
const Hidden = "\x1b[8m";

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";
const FgGray = "\x1b[90m";

const BgBlack = "\x1b[40m";
const BgRed = "\x1b[41m";
const BgGreen = "\x1b[42m";
const BgYellow = "\x1b[43m";
const BgBlue = "\x1b[44m";
const BgMagenta = "\x1b[45m";
const BgCyan = "\x1b[46m";
const BgWhite = "\x1b[47m";
const BgGray = "\x1b[100m";
	
function copyRecursiveSyncByExtension(src, dest, extension, actionForFile) {
	var exists = fs.existsSync(src);
	var stats = exists && fs.lstatSync(src);
	var isDirectory = exists && stats.isDirectory();
	
	if(actionForFile == undefined)
	{
		actionForFile = (src, dest) => fs.copyFileSync(src, dest);
	}
	
	if (isDirectory) {
		if(!fs.existsSync(dest))
		{
			fs.mkdirSync(dest);
		}
		fs.readdirSync(src).forEach(function(childItemName) {
			copyRecursiveSyncByExtension(path.join(src, childItemName), path.join(dest, childItemName), extension, actionForFile);
		});
	} else {
		if(path.extname(src) == extension)
		{
			actionForFile(src, dest);
		}
	}
}

function printToLog(type, message)
{
	let date_ob = new Date();

	// current hours
	let hours = ("0" + date_ob.getHours()).slice(-2);

	// current minutes
	let minutes = ("0" + date_ob.getMinutes()).slice(-2);

	// current seconds
	let seconds = ("0" + date_ob.getSeconds()).slice(-2);

	const messagePrefix = hours + ":" + minutes + ":" + seconds + " - ";
	let finalMessage = "";
	
	switch (type) {
	  case 'success':
		finalMessage = FgGreen + message + Reset;
		break;
	  case 'error':
		finalMessage = FgRed + message + Reset;
		break;
	  case 'warning':
		finalMessage = FgYellow + message + Reset;
		break;
	  case 'log':
		finalMessage = message;
		break;
	  default:
		throw new Error("Unknown type: '" + type + "'");
	}
	
	console.log(messagePrefix + finalMessage);
}

function runScript(command, args, callback, cwd) {
    let child = null;
	
	if(cwd != undefined)
	{
		child = child_process.spawn(command, args, { detached: false, cwd: cwd, stdio: 'pipe'});
	} else {
		child = child_process.spawn(command, args, { detached: false, stdio: 'pipe'});
	}
		
	let stderrOutput = "";
	let stdoutOutput = "";
	
    child.stdout.on('data', function(data) {
        data=data.toString();
        stdoutOutput+=data;
    });

    child.stderr.on('data', function(data) {
        data=data.toString();
        stderrOutput+=data;
    });

    child.on('close', function(code) {
        callback(stdoutOutput,stderrOutput,code);
    });
}

module.exports = {
	getAddonName: () => {
		if (!/^[a-z][\d_a-z]+$/.test(packageJson.name)) {
			throw new Error(
				"Addon name may consist only of lowercase characters, digits, and underscores " +
					"and should start with a letter. Edit `name` field in `package.json` file.",
			);
		}

		return packageJson.name;
	},
	getDotaPath: async () => {
		try {
			return await findSteamAppByName("dota 2 beta");
		} catch (error) {
			if (!(error instanceof SteamNotFoundError)) {
				throw error;
			}
		}
	},
	copyRecursiveSyncByExtension: copyRecursiveSyncByExtension,
	print: printToLog,
	runScript: runScript
};