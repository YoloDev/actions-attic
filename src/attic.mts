import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as os from "node:os";
import * as path from "node:path";
import * as url from "node:url";
import which from "which";
import { splitArgs } from "./utils.mts";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsDir = path.resolve(__dirname, "..", "scripts");

// inputs
const server = core.getInput("server", { required: true });
const serverName = core.getInput("serverName") || "attic";
const cacheName = core.getInput("cacheName", { required: true });
const extraPullNames = core.getInput("extraPullNames");
const authToken = core.getInput("token");
const skipPush = core.getBooleanInput("skipPush");
const pathsToPush = core.getInput("pathsToPush");
const pushFilter = core.getInput("pushFilter");
const skipAddingSubstituter = core.getBooleanInput("skipAddingSubstituter");
// const useDaemon = core.getBooleanInput("useDaemon");
const atticBinInput = core.getInput("atticBin");
const installCommand =
	core.getInput("installCommand") || "nix profile add nixpkgs#attic-client";

enum PushMode {
	// Disable pushing entirely.
	None = "None",
	// Push paths provided via the `pathsToPush` input.
	PushPaths = "PushPaths",
	// Scans the entire store during the pre- and post-hooks and uploads the difference.
	// This is a very simple method and is likely to work in any environment.
	// There are two downsides:
	//   1. The final set of paths to push is computed in the post-build hook, so paths are not pushed during builds.
	//   2. It is not safe to use in a multi-user environment, as it may leak store paths built by other users.
	StoreScan = "StoreScan",
	// Uses the attic daemon to register a post-build hook with the Nix Daemon.
	// Very efficient as it can upload paths as they are built.
	// May not be supported in all environment (e.g. NixOS Containers) and inherits all of the implementation deficiencies of Nix's post-build hook.
	// Daemon = "Daemon",
}

export async function setup() {
	let atticBin = atticBinInput;

	if (atticBin !== "") {
		core.debug(`Using attic executable from input: ${atticBin}`);
	} else {
		// Find the attic executable in PATH
		let resolvedAtticBin = await which("attic", { nothrow: true });

		if (resolvedAtticBin) {
			atticBin = resolvedAtticBin;
			core.debug(`Found attic executable: ${atticBin}`);
		} else {
			core.startGroup("attic: installing");
			await exec.exec("bash", ["-c", installCommand]);
			atticBin = await which("attic");
			core.debug(`Installed attic executable: ${atticBin}`);
			core.endGroup();
		}
	}

	core.saveState("atticBin", atticBin);

	// Print the executable version.
	// Also verifies that the binary exists and is executable.
	core.startGroup("attic: checking version");
	await exec.exec(atticBin, ["--version"]);
	core.endGroup();

	let hasPushTokens = false;
	await exec.exec(atticBin, [
		"login",
		"--set-default",
		serverName,
		server,
		authToken,
	]);
	if (authToken !== "") {
		hasPushTokens = true;
	}

	core.saveState("hasPushTokens", hasPushTokens);

	if (skipAddingSubstituter) {
		core.info(
			"Not adding attic cache to substituters as skipAddingSubstituter is set to true",
		);
	} else {
		core.startGroup(`attic: using cache ${serverName}:${cacheName}`);
		await exec.exec(atticBin, ["use", `${serverName}:${cacheName}`]);
		core.endGroup();
	}

	if (extraPullNames !== "") {
		core.startGroup(`attic: using extra caches ` + extraPullNames);
		const extraPullNameList = extraPullNames.split(",");
		for (let itemName of extraPullNameList) {
			const trimmedItemName = itemName.trim();
			await exec.exec(atticBin, ["use", `${serverName}:${trimmedItemName}`]);
		}
		core.endGroup();
	}

	// Determine the push mode to use
	let pushMode = PushMode.None;
	if (hasPushTokens && !skipPush) {
		if (pathsToPush) {
			pushMode = PushMode.PushPaths;
		} else {
			// TODO: support daemon
			pushMode = PushMode.StoreScan;
		}
	}

	core.saveState("pushMode", pushMode);

	const tmpdir = process.env["RUNNER_TEMP"] ?? os.tmpdir();

	switch (pushMode) {
		case PushMode.StoreScan: {
			// Remember existing store paths
			const preBuildPathsFile = `${tmpdir}/store-path-pre-build`;
			core.saveState("preBuildPathsFile", preBuildPathsFile);
			await exec.exec("sh", [
				"-c",
				`${scriptsDir}/list-nix-store.sh > ${preBuildPathsFile}`,
			]);
			break;
		}

		default:
			break;
	}
}

export async function upload() {
	core.startGroup("attic: push");

	const atticBin = core.getState("atticBin");
	const pushMode = core.getState("pushMode");

	switch (pushMode) {
		case PushMode.None: {
			core.info("Pushing is disabled.");

			const hasPushTokens = !!core.getState("hasPushTokens");

			if (skipPush) {
				core.info("skipPush is enabled.");
			} else if (!hasPushTokens) {
				core.info(
					"Missing a attic auth token. Provide an token to enable pushing to the cache.",
				);
			}

			break;
		}

		case PushMode.PushPaths: {
			await exec.exec(atticBin, [
				"push",
				// ...splitArgs(atticArgs),
				`${serverName}:${cacheName}`,
				...splitArgs(pathsToPush),
			]);
			break;
		}

		case PushMode.StoreScan: {
			const preBuildPathsFile = core.getState("preBuildPathsFile");
			await exec.exec(`${scriptsDir}/push-paths.sh`, [
				atticBin,
				"", // atticArgs,
				`${serverName}:${cacheName}`,
				preBuildPathsFile,
				pushFilter,
			]);
			break;
		}

		// TODO: support daemon
	}

	core.endGroup();
}
