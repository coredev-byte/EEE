import manifest from "../public/assets/animations/manifest.json";

/** The offline manifest is the single registration consumed by the game. */
export const ASSET_REGISTRY = manifest.assets;
export type AssetName = keyof typeof ASSET_REGISTRY;
export const RUNTIME_ASSETS = Object.entries(ASSET_REGISTRY)
  .filter(([, contract]) => contract.runtime)
  .map(([name, contract]) => ({ name, path: contract.path,
    width: contract.sourceSize[0], height: contract.sourceSize[1] }));

export function assertSourceDimensions(name: string, width: number, height: number) {
  const entry = ASSET_REGISTRY[name as AssetName];
  if (!entry || width !== entry.sourceSize[0] || height !== entry.sourceSize[1])
    throw new Error(`Asset ${name}: decoded dimensions do not match the offline registry`);
}
