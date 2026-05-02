export function splitArgs(args: string): string[] {
	return args.split(" ").filter((arg) => arg !== "");
}
