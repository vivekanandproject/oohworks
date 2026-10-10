import { getVersion, setWorkerUrl } from "maplibre-gl";

let set = false;

/** The worker is served from this site (see scripts/copy-map-worker.mjs), not from beside the bundled library. */
export function loadOwnWorker(): void {
  if (set) return;
  set = true;
  setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${getVersion()}`);
}
