# Simple Proxy Restarter

A lightweight Firefox extension designed to reset proxy settings and restore a preferred proxy mode with a single click.

## Features

- Reset and restore Firefox proxy settings.
- Choose a preferred proxy mode from the toolbar context menu.
- Supports the following proxy modes:
  - No proxy
  - Auto-detect proxy settings
  - Use system proxy settings
  - Manual proxy configuration
  - Automatic proxy configuration URL (PAC)
- Stores extension preferences locally using Firefox storage.

## Installation

### Install the signed extension

1. Download the latest `.xpi` file from the project's [GitHub Releases](../../releases).
2. Open Firefox.
3. Open `about:addons`.
4. Use the Add-ons menu to select **Install Add-on From File**, if available.
5. Select the downloaded `.xpi` file and confirm installation.

### Development installation

1. Clone or download this repository.
2. Open `about:debugging` in Firefox.
3. Select **This Firefox**.
4. Choose **Load Temporary Add-on**.
5. Select the project's `manifest.json` file.

Development installations loaded this way are temporary and may need to be loaded again after Firefox restarts.

## Usage

1. Install and enable the extension.
2. Right-click the extension's toolbar icon to choose a preferred proxy mode.
3. Left-click the toolbar icon to run the reset-and-restore operation.

Manual proxy configuration and PAC mode require valid configuration settings. Test your selected mode before relying on it.

## Privacy

The extension stores its preferences and saved proxy configuration in Firefox's local extension storage. The current source code does not intentionally transmit this information to a remote server.

The extension requests proxy access to manage Firefox proxy settings. Review the source code before installing or distributing modified versions.

## Permissions

- `proxy` — access and manage Firefox proxy settings.
- `menus` — provide proxy mode options in the toolbar context menu.
- `storage` — store preferences locally.
- `<all_urls>` — provide access required by the extension's proxy functionality.

## Compatibility

Designed for desktop Firefox. Compatibility with Firefox for Android has not been established.

## Contributing

Bug reports, suggestions, and pull requests are welcome. Please include clear reproduction steps when reporting a problem.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
