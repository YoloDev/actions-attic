import * as core from "@actions/core";
import { upload } from "./attic.mts";

try {
	upload();
	core.debug("Upload done");
} catch (error) {
	core.setFailed(`Action failed with error: ${error}`);
}
