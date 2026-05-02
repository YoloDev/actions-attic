import {
  debug,
  setFailed,
  upload
} from "./main-sw8kd3a5.js";

// src/post.mts
try {
  upload();
  debug("Upload done");
} catch (error) {
  setFailed(`Action failed with error: ${error}`);
}
