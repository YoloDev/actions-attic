{
  description = "A very basic flake";

  # the nixConfig here only affects the flake itself, not the system configuration!
  nixConfig = {
    experimental-features = [ "nix-command" "flakes" ];

    substituters = [
      "https://cache.nixos.org"
    ];

    # nix community's cache server
    extra-substituters = [
      "https://nix-community.cachix.org"
      "https://staging.attic.rs/attic-ci"
      "https://attic.alxandr.me/attic"
    ];
    extra-trusted-public-keys = [
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
      "attic-ci:U5Sey4mUxwBXM3iFapmP0/ogODXywKLRNgRPQpEXxbo="
      "attic:iSJ9/8whtGsJxS8vVYdwOICWRwnjFKkzf8TAWe82d0E="
    ];
  };

  inputs = {
    # Pin our primary nixpkgs repository. This is the main nixpkgs repository
    # we'll use for our configurations. Be very careful changing this because
    # it'll impact your entire system.
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";

    flake-utils.url = "github:numtide/flake-utils";

    attic = {
      url = "github:zhaofengli/attic";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.nixpkgs-stable.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, attic, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" ]
      (system:
        let
          node_version_overlay = final: prev: {
            nodejs = prev.nodejs_20;
          };
          pkgs = import nixpkgs {
            inherit system;
            overlays = [
              node_version_overlay
              attic.overlays.default
            ];
          };
        in
        {
          packages = {
            attic = pkgs.attic-client;
          };

          apps = {
            attic = {
              type = "app";
              program = "${pkgs.attic-client}/bin/attic";
            };
          };

          devShells.default = pkgs.mkShell {
            buildInputs = with pkgs; [
              attic-client
              nodejs
              git
              gh
            ];
          };
        });
}
