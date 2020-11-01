# Testr

[![](https://vsmarketplacebadge.apphb.com/version-short/tscpp.testr.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=tscpp.testr)
[![](https://vsmarketplacebadge.apphb.com/installs-short/tscpp.testr.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=tscpp.testr)
[![](https://vsmarketplacebadge.apphb.com/rating-short/tscpp.testr.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=tscpp.testr&ssr=false#review-details)
[![](https://img.shields.io/badge/paypal-donate-blue?style=flat-square)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=Q72MU4KDX6H6W&source=url)

**Tester automatically runs the tests from your package.json file in the background after a workspace configuration to provide a status of the test in the status bar.**

## States

<table>
<tr align="center">
<th>Statusbar</th>
<th>State</th>
<th>Description</th>
</tr>

<tr align="center">
<td><img src="https://https://github.com/tscpp/testr/tree/master/assets/error.png" alt="Extension Error" vlign="bottom" valign="bottom"></td>
<td><b>Extension Error</b></td>
<td>Either the extension has failed or Testr is not setup yet. Click the status bar item to quick setup.</td>
</tr>

<tr align="center">
<td><img src="https://https://github.com/tscpp/testr/tree/master/assets/success.png" alt="Test Success" vlign="bottom" valign="bottom"></td>
<td><b>Test Success</b></td>
<td>The test has succeeded and returned a success exit code. See <a href="#extension-settings">extension settings</a>.</td>
</tr>

<tr align="center">
<td><img src="https://https://github.com/tscpp/testr/tree/master/assets/fail.png" alt="Test Failed" vlign="bottom" valign="bottom"></td>
<td><b>Test Failed</b></td>
<td>The test has failed and returned a unsuccessful exit code. See <a href="#extension-settings">extension settings</a>.</td>
</tr>

<tr align="center">
<td><img src="https://https://github.com/tscpp/testr/tree/master/assets/cooldown.png" alt="Test Cooldown" vlign="bottom" valign="bottom"></td>
<td><b>Test Cooldown</b></td>
<td>The content change event has been triggered and Testr is waiting for the cooldown. See <a href="#extension-settings">extension settings</a>.</td>
</tr>

<tr align="center">
<td><img src="https://https://github.com/tscpp/testr/tree/master/assets/loading.png" alt="Test Running" vlign="bottom" valign="bottom"></td>
<td><b>Test Running</b></td>
<td>The test specified in package.json is running, Testr is blocking any change events.</td>
</tr>
</table>

## Requirements

**Npm and node 8.0.0** or above installed as well as a package.json file with the test script available.

## Extension Settings

Testr contributes the following settings:

* `testr.enable`: Enables Testr. Used by auto configuration.
* `testr.autoTest`: Wether Testr should automatically run the tests, optinally the timeout between changes.
* `testr.successExitCodes`: Exit codes Testr should consider as successful.
* `testr.runWith`: Wether Testr should run with terminal or npm. Consider using terminal for performance and speed.
* `testr.promptConfig`: Wether Testr should prompt to config Testr.

## Known Issues

See all issues at [https://github.com/tscpp/testr/issues](https://github.com/tscpp/testr/issues).
