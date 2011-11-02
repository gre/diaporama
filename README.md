What do you need ?
==================

You can download the library with the download button.

Dependencies:

* jQuery

Note for Slider.js developers
===================

The project is build with a Makefile and via the `make` command.
The command takes care to compile LESS and CoffeeScript code when files change.

There are some dependencies to make it work.

Required commands:

* `coffee`, to compile the CoffeeScript.
* `lessc`, to compile the LESS.
* `yuicompressor`, to minimize the Javascript.
* `docco`, to build the documentation. It is (currently) an NodeJS package

You are not required to use the Makefile if you simply want to adapt Slider.js to your website (you can just edit the compiled CSS and Javascript which are still readable) 
but if you want to contribute to Slider.js by pull request please use it to keep all compiled files "synchronized" in a coherent state.

TIPS
----
These are both command I use to run to focus on the development:

    while((1)); do make; sleep 1; done   # that's a little hacky but make does nothing if no file has changed

    python -m SimpleHTTPServer 8001      # or equivalent to run a http server

License
=======

Copyright 2011 Gaetan Renaudeau

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
