import {
  debug,
  setFailed,
  setup
} from "./main-1xwkbz70.js";

// src/main.mts
try {
  await setup();
  debug("Setup done");
} catch (error) {
  setFailed(`Action failed with error: ${error}`);
}
