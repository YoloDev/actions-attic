import * as core from "@actions/core";
import { setup } from "./attic.mts";

try {
	setup();
	core.debug("Setup done");
} catch (error) {
	core.setFailed(`Action failed with error: ${error}`);
}
