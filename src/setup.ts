import * as actions from "@actions/core";
import * as exec from "@actions/exec";
import slugify from "slugify";

// const readOnly = actions.getBooleanInput("read-only");
const endpoint = actions.getInput("server", { required: true });
const cache = actions.getInput("cache", { required: true });
const token = actions.getInput("token", { required: false });

const endpointName = slugify.default(
	endpoint.replace(/^https?:\/\//i, "").replace(/\.|\/|:/g, "-"),
	{ lower: true },
);

const cacheName = `${endpointName}:${cache}`;

const nix = async (
	description: string,
	args: readonly string[],
	returnOutput = false,
) => {
	actions.startGroup(description);
	actions.debug(`nix ${args.join(" ")}`);

	let stdout = "";
	const listeners = returnOutput
		? {
				stdout: (data: Buffer) => {
					stdout += data.toString();
				},
		  }
		: void 0;

	await exec.exec(
		"nix",
		[
			"--experimental-features",
			"nix-command flakes",
			"--substituters",
			"https://cache.nixos.org https://nix-community.cachix.org https://attic.alxandr.me/attic",
			"--trusted-public-keys",
			"cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY= nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs= attic:iSJ9/8whtGsJxS8vVYdwOICWRwnjFKkzf8TAWe82d0E=",
			...args,
		],
		{ listeners },
	);
	actions.debug(`done`);
	actions.endGroup();
	return stdout;
};

await nix("fetch flake", ["flake", "prefetch", "github:YoloDev/actions-attic"]);

const buildResult = await nix(
	"install attic",
	[
		"build",
		"github:YoloDev/actions-attic#attic",
		"--no-link",
		"--print-out-paths",
	],
	true,
);

const atticDir = buildResult.trim();
actions.addPath(`${atticDir}/bin`);

const attic = `${atticDir}/bin/attic`;
actions.info(`attic installed at: ${attic}`);

actions.startGroup(`configure remote ${endpointName}`);
await exec.exec(
	attic,
	["login", endpointName, endpoint, token].filter(Boolean),
);

await exec.exec(attic, ["cache", "info", cacheName]);
actions.endGroup();

await exec.exec(attic, ["use", cacheName]);

actions.setOutput("endpointName", endpointName);
actions.setOutput("cache", cacheName);

// TODO: Spawn watcher
