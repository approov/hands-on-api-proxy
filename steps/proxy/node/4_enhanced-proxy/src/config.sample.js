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

module.exports = {
  proxy_port:           /* port the proxy listens on */
      8080,
  nasa_host:            /* NASA API host */
      'api.nasa.gov',
  nasa_protocol:        /* NASA API protocol */
      'https:',
  approov_header:       /* Approov header name */
      'approov',
  approov_enforcement:  /* set true to enforce token checks */
      true,
};

// end of file
