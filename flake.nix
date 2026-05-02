{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    yoloproj = {
      url = "github:yolodev/yoloproj";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ yoloproj, ... }:
    yoloproj.lib.mkFlake inputs {
      debug = true;

      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];

      perSystem =
        {
          pkgs,
          lib,
          # config,
          ...
        }:
        {
          formatter = pkgs.nixfmt;

          devshells.default.packages = [
            pkgs.attic-client
            pkgs.bun
            pkgs.act
          ];

          # The build-dist hook generates new files
          pre-commit.check.enable = false;
          pre-commit.settings.hooks = {
            build-dist = {
              enable = true;
              files = "src/.*$";
              pass_filenames = false;
              entry = "${lib.getExe pkgs.bun} run build";
            };

            prettier = {
              enable = true;
              files = "(src/.*\.ts|.*\.md|.*\.yml)$";
            };
          };
        };
    };
}
