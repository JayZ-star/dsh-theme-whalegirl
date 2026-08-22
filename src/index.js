/**
 * dsh-theme-whalegirl — host half.
 *
 * Pure-visual plugin: the theme, wallpaper and skin CSS live entirely in the
 * browser half (exports["./client"], discovered through the package.json
 * dsh.client declaration). An empty apply exists so the row mounts in the
 * host Loader and the client-modules scan recognises this package as a web
 * client plugin.
 */
export function apply() {}
