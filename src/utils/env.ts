export function isNodeLikeEnvironment(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.versions !== "undefined" &&
    typeof process.versions.node === "string"
  );
}

export function hasFetch(): boolean {
  return typeof fetch === "function";
}
