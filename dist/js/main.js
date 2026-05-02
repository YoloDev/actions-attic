import {
  debug,
  setFailed,
  setup
} from "./main-sw8kd3a5.js";

// src/main.mts
try {
  setup();
  debug("Setup done");
} catch (error) {
  setFailed(`Action failed with error: ${error}`);
}
