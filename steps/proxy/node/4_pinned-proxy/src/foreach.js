/*
 * Copyright (C) 2017 CriticalBlue, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path')
const fs = require('fs');

/**
 * Executes a callback for each matching file in a directory and
 * recursively through subdirectories.
 *
 * @param {string} dir The starting directory.
 * @param {regexp} filter A regular expression to match against file names.
 * @param {function} callback The function called when a file match is found.
 */
function fileInDir(dir, filter, callback) {

  if (!fs.existsSync(dir)) {
    // exit if directory not found
    return;
  }

  var files = fs.readdirSync(dir);
  for (var i = 0; i < files.length; i++) {
    var file = path.join(dir, files[i]);
    var stat = fs.lstatSync(file);
    if (stat.isDirectory()) {
      // recurse into subdirectory
      fileInDir(file, filter, callback);
    } else {
      if (filter.test(file)) {
        // callback with file match
        callback(file);
      }
    }
  };
};

module.exports = {
  fileInDir: fileInDir,
};

// end of file
