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

/*
 * CAUTION: DO NOT ADD SECRETS TO THE SAMPLE src/secrets.sample.js FILE!
 *
 * 1) Copy src/secrets.sample.js to src/secrets.js.
 * 2) Modify secrets in the src/secrets.js file ONLY.
 *
 * The src/secrets.js file will be ignored by git.
 */

module.exports = {
  nasa_api_key:         /* api key received from NASA */
      'YOUR NASA API KEY STRING HERE',
  approov_token_secret: /* token secret received from Approov demo download */
      'APPROOV DEMO TOKEN SECRET BASE64 STRING HERE',
};

// end of file
