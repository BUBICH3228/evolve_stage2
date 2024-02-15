const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const utils = require("./utils");

const projectsNames = ["panorama", "vscripts"]

function GetPathToProjectCommonDirectory(projectName)
{
	return path.resolve(__dirname, "../src/", projectName, "./common/");
}

(async () => {
	const commonDirectory = path.resolve(__dirname, "../src/common/");
			
	const commonModuleNames = fs.readdirSync(commonDirectory, { withFileTypes: true })
		.filter((item) => item.isDirectory())
		.map((item) => item.name);
		
	for (const projectName of projectsNames) {
		const projectModulesDirectory = GetPathToProjectCommonDirectory(projectName);
		
		fs.ensureDirSync(projectModulesDirectory);
		
		const projectModuleNames = fs.readdirSync(projectModulesDirectory, { withFileTypes: true })
		.filter((item) => item.isSymbolicLink())
		.map((item) => item.name);
				
		const projectModulesToRemove = projectModuleNames.filter(x => !commonModuleNames.includes(x));
				
		for(const projectModuleToRemove of projectModulesToRemove)
		{
			//console.log("Trying to remove " + projectModuleToRemove);
			const pathToRemovedProjectModule = path.resolve(projectModulesDirectory, projectModuleToRemove);
			fs.unlink(pathToRemovedProjectModule, (err => {
			  if(err)
			  {
				throw new Error("Failed to remove deleted common module '" + projectModuleToRemove + "' in project '" + projectName + "'");
			  }
			}));
		}
	}
		
	for (const moduleName of commonModuleNames) {
		for (const projectName of projectsNames) {
			const sourcePath = path.resolve(commonDirectory, moduleName);
			const targetPathBase = GetPathToProjectCommonDirectory(projectName);
			const targetPath = path.resolve(targetPathBase, moduleName);
			
			assert(fs.existsSync(sourcePath), `Could not find '${sourcePath}'`);

			if (!fs.existsSync(targetPathBase)){
				fs.mkdirSync(targetPathBase, { recursive: true });
			}

			if (fs.existsSync(targetPath)) {
				const isCorrect = fs.lstatSync(targetPath).isSymbolicLink() && fs.realpathSync(targetPath) === sourcePath;
				if (isCorrect) {
					//console.log(`Skipping '${sourcePath}' since it is already linked`);
					continue;
				} else {
					throw new Error(`'${targetPath}' is already linked to another directory`);
				}
			}

			//fs.moveSync(targetPath, sourcePath);
			fs.symlinkSync(sourcePath, targetPath, "junction");
		}
	}
})().catch(error => {
	utils.print("error", error);
    process.exit(1);
});