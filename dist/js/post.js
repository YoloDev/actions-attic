import {
  debug,
  upload,
  warning
} from "./main-1xwkbz70.js";

// src/post.mts
try {
  await upload();
  debug("Upload done");
} catch (error) {
  warning(`Post action failed, but not failing build`);
  warning(`Post action failed with error: ${error}`);
}
