
const DEFAULT_MODE = "system";
const RESET_DELAY = 500;
const BADGE_DELAY = 1500;

const CONFIGS_KEY = "savedProxyConfigs";
const MODE_KEY = "preferredProxyMode";

let isResetting = false;

const MODES = [
  { id: "none", title: "No proxy" },
  {
    id: "autoDetect",
    title: "Auto-detect proxy settings for this network"
  },
  {
    id: "system",
    title: "Use system proxy settings"
  },
  {
    id: "manual",
    title: "Manual proxy configuration"
  },
  {
    id: "autoConfig",
    title: "Automatic proxy configuration URL"
  }
];

const SIMPLE_MODES = new Set([
  "none",
  "autoDetect",
  "system"
]);

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function setBadge(text, color) {
  await browser.browserAction.setBadgeText({ text });

  if (color) {
    await browser.browserAction.setBadgeBackgroundColor({
      color
    });
  }
}

async function showError(error) {
  console.error("Simple Proxy Restarter:", error);

  try {
    await setBadge("ERR", "#ef4444");
  } catch (badgeError) {
    console.error("Badge update failed:", badgeError);
  }
}

async function getConfigs() {
  const result = await browser.storage.local.get(CONFIGS_KEY);
  return result[CONFIGS_KEY] || {};
}

async function saveConfig(value) {
  if (!value || !value.proxyType) return;

  const configs = await getConfigs();

  configs[value.proxyType] = { ...value };

  await browser.storage.local.set({
    [CONFIGS_KEY]: configs
  });
}

async function getPreferredMode() {
  const result = await browser.storage.local.get(MODE_KEY);

  return MODES.some((mode) => mode.id === result[MODE_KEY])
    ? result[MODE_KEY]
    : DEFAULT_MODE;
}

async function refreshMenuChecks() {
  const preferred = await getPreferredMode();

  for (const mode of MODES) {
    await browser.menus.update(mode.id, {
      checked: mode.id === preferred
    });
  }

  await browser.menus.refresh();
}

async function createMenu() {
  // Prevent duplicate menu items when initialization runs again.
  await browser.menus.removeAll();

  for (const mode of MODES) {
    browser.menus.create({
      id: mode.id,
      title: mode.title,
      type: "radio",
      contexts: ["browser_action"],
      checked: mode.id === DEFAULT_MODE
    });
  }

  await refreshMenuChecks();
}

async function getTargetConfig(modeId) {
  const configs = await getConfigs();

  if (configs[modeId]) {
    return { ...configs[modeId] };
  }

  // These modes do not require additional proxy parameters.
  if (SIMPLE_MODES.has(modeId)) {
    return { proxyType: modeId };
  }

  // Manual and PAC require actual saved configuration.
  return null;
}

// Keep the latest configuration of each mode.
// Ignore temporary changes performed during a reset.
browser.proxy.settings.onChange.addListener((details) => {
  if (isResetting) return;

  saveConfig(details.value).catch((error) => {
    console.error("Could not save proxy configuration:", error);
  });
});

// Right-click menu: save the preferred destination mode.
browser.menus.onClicked.addListener(async (info) => {
  const mode = MODES.find(
    (item) => item.id === info.menuItemId
  );

  if (!mode || isResetting) return;

  try {
    await browser.storage.local.set({
      [MODE_KEY]: mode.id
    });
    const targetConfig = await getTargetConfig(mode.id);

    if (!targetConfig) {
    throw new Error("No saved configuration for this mode");
    }

    await browser.proxy.settings.set({
    value: targetConfig
    });
    await refreshMenuChecks();

    // Selecting a mode saves the preference; it does not
    // immediately change Firefox's active proxy settings.
    await setBadge("SAV", "#9333ea");
    await sleep(BADGE_DELAY);
    await setBadge("");
  } catch (error) {
    await showError(error);
  }
});

// Left-click: temporarily disable proxy, then restore
// the selected mode and its complete saved configuration.
browser.browserAction.onClicked.addListener(async () => {
  if (isResetting) return;

  isResetting = true;

  let targetConfig = null;
  let resetStarted = false;

  try {
    await setBadge("...", "#9333ea");

    const preferred = await getPreferredMode();

    targetConfig = await getTargetConfig(preferred);

    if (!targetConfig) {
      throw new Error(
        `No saved configuration for "${preferred}". ` +
        "Configure this mode in Firefox settings first, " +
        "then try again."
      );
    }

    if (
      preferred === "manual" &&
      !(
        targetConfig.httpProxy ||
        targetConfig.sslProxy ||
        targetConfig.ftpProxy ||
        targetConfig.socks ||
        targetConfig.socksProxy
      )
    ) {
      throw new Error(
        "Manual proxy configuration is incomplete. " +
        "Configure the proxy in Firefox first."
      );
    }

    if (
      preferred === "autoConfig" &&
      !targetConfig.autoConfigUrl
    ) {
      throw new Error(
        "No PAC URL is saved. Configure the URL in Firefox first."
      );
    }

    resetStarted = true;

    await browser.proxy.settings.set({
      value: { proxyType: "none" }
    });

    await sleep(RESET_DELAY);

    await browser.proxy.settings.set({
      value: { ...targetConfig }
    });

    await setBadge("OK", "#10b981");
    await sleep(BADGE_DELAY);
    await setBadge("");
  } catch (error) {
    await showError(error);

    // Best-effort recovery if the reset failed midway.
    if (resetStarted && targetConfig) {
      try {
        await browser.proxy.settings.set({
          value: { ...targetConfig }
        });
      } catch (restoreError) {
        console.error("Proxy recovery failed:", restoreError);
      }
    }
  } finally {
    isResetting = false;
  }
});

async function initialize() {
  try {
    // Save the currently active configuration.
    const current = await browser.proxy.settings.get({});
    await saveConfig(current.value);

    const stored = await browser.storage.local.get(MODE_KEY);

    if (!MODES.some((mode) => mode.id === stored[MODE_KEY])) {
      await browser.storage.local.set({
        [MODE_KEY]: DEFAULT_MODE
      });
    }

    await createMenu();
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

initialize();
