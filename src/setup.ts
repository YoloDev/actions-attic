import * as actions from "@actions/core";
import { execa } from "execa";
import slugify from "slugify";

const readOnly = actions.getInput("read-only") === "true";
const endpoint = actions.getInput("server", { required: true });
const cache = actions.getInput("cache", { required: true });
const token = actions.getInput("token", { required: false });

const cacheName = slugify.default(`${endpoint}-${cache}`);

const nix = async (description: string, args: readonly string[]) => {
	actions.info(description);
	actions.debug(`nix ${args.join(" ")}`);
	await execa(
		"sudo",
		[
			"nix",
			"--experimental-features",
			"nix-command flakes",
			"--substituters",
			"https://cache.nixos.org https://nix-community.cachix.org https://attic.alxandr.me/attic",
			"--trusted-public-keys",
			"cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY= nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs= attic:iSJ9/8whtGsJxS8vVYdwOICWRwnjFKkzf8TAWe82d0E=",
			...args,
		],
		{ stdout: "inherit", stderr: "inherit", stdin: "inherit" },
	);
	actions.debug(`done`);
};

await nix("fetch flake", ["flake", "prefetch", "github:YoloDev/actions-attic"]);
await nix("install attic", [
	"build",
	"github:YoloDev/actions-attic#attic",
	"--no-link",
	"--print-out-paths",
	"--verbose",
]);
// await execa(
// 	"nix",
// 	[
// 		"--experimental-features",
// 		"nix-command flakes",
// 		"--substituters",
// 		"https://cache.nixos.org https://nix-community.cachix.org https://attic.alxandr.me/attic",
// 		"--trusted-public-keys",
// 		"cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY= nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs= attic:iSJ9/8whtGsJxS8vVYdwOICWRwnjFKkzf8TAWe82d0E=",
// 		"run",
// 		"github:YoloDev/actions-attic#attic",
// 		"--",
// 		"login",
// 		cacheName,
// 		endpoint,
// 		token,
// 	].filter(Boolean),
// 	{ stdout: "inherit", stderr: "inherit", stdin: "inherit" },
// );
