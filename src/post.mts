import * as core from "@actions/core";
import { upload } from "./attic.mts";

try {
	await upload();
	core.debug("Upload done");
} catch (error) {
	core.warning(`Post action failed, but not failing build`);
	core.warning(`Post action failed with error: ${error}`);
}
