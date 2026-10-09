// Browser-only wrapper around Google Picker (https://developers.google.com/drive/picker).

type PickerCallbackData = { action: string; docs?: { id: string; name: string }[] };

type DocsView = {
  setIncludeFolders(value: boolean): DocsView;
  setSelectFolderEnabled(value: boolean): DocsView;
  setMimeTypes(types: string): DocsView;
};
type Picker = { setVisible(visible: boolean): void };
type PickerBuilder = {
  addView(view: DocsView): PickerBuilder;
  setOAuthToken(token: string): PickerBuilder;
  setDeveloperKey(key: string): PickerBuilder;
  setAppId(appId: string): PickerBuilder;
  setLocale(locale: string): PickerBuilder;
  setCallback(callback: (data: PickerCallbackData) => void): PickerBuilder;
  build(): Picker;
};
type PickerApi = {
  ViewId: { FOLDERS: string };
  Action: { PICKED: string };
  DocsView: new (viewId: string) => DocsView;
  PickerBuilder: new () => PickerBuilder;
};

declare global {
  interface Window {
    gapi?: { load(api: string, options: { callback: () => void; onerror: () => void }): void };
    google?: { picker?: PickerApi };
  }
}

export type PickerConfig = { accessToken: string; apiKey: string; appId: string };
export type PickedFolder = { id: string; name: string };

const SCRIPT_URL = "https://apis.google.com/js/api.js";
let pickerReady: Promise<PickerApi> | null = null;

function loadPicker(): Promise<PickerApi> {
  pickerReady ??= new Promise<PickerApi>((resolve, reject) => {
    const fail = () => {
      pickerReady = null;
      reject(new Error("Google Picker failed to load"));
    };
    const loadApi = () =>
      window.gapi
        ? window.gapi.load("picker", {
            callback: () => (window.google?.picker ? resolve(window.google.picker) : fail()),
            onerror: fail,
          })
        : fail();

    if (window.gapi) return loadApi();
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = loadApi;
    script.onerror = fail;
    document.head.append(script);
  });
  return pickerReady;
}

// Resolves to null when the user closes the dialog without choosing a folder.
export async function pickFolder({
  accessToken,
  apiKey,
  appId,
}: PickerConfig): Promise<PickedFolder | null> {
  const picker = await loadPicker();
  return new Promise((resolve) => {
    const view = new picker.DocsView(picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMimeTypes("application/vnd.google-apps.folder");
    new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setAppId(appId)
      .setLocale("uk")
      .setCallback((data) => {
        if (data.action === picker.Action.PICKED) {
          const doc = data.docs?.[0];
          resolve(doc ? { id: doc.id, name: doc.name } : null);
        } else if (data.action === "cancel") {
          resolve(null);
        }
      })
      .build()
      .setVisible(true);
  });
}
