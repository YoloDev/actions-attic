// import * as actions from "@actions/core";
import { execa } from "execa";

await execa("nix", [
	"--experimental-features",
	"nix-command flakes",
	"--substituters",
	"https://cache.nixos.org https://nix-community.cachix.org https://attic.alxandr.me/attic",
	"--trusted-public-keys",
	"cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY= nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs= attic:iSJ9/8whtGsJxS8vVYdwOICWRwnjFKkzf8TAWe82d0E=",
	"run",
	"github:YoloDev/actions-attic#attic",
	"--",
	"--help",
]);
