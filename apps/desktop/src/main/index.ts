import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL;

function createMainWindow(): void {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Kworum",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // The app is a single page: links open in the system browser, never in here.
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (DEV_SERVER_URL !== undefined) {
    void window.loadURL(DEV_SERVER_URL);
  } else {
    void window.loadFile(
      path.join(import.meta.dirname, "..", "renderer", "index.html"),
    );
  }
}

void app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
