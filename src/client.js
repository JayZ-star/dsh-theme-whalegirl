/**
 * DeepSeek-鲸鱼娘 (Whale Girl) theme for the DeepSeek Harness web GUI —
 * browser half. Ported from the DreamSkin skin package
 * (dreamskin.cc/themes/ver_cb557ececaa5de3f3dbe, "DeepSeek-鲸鱼娘").
 *
 * What it does:
 *  - Registers one light theme ("deepseek-whalegirl") into the official
 *    ThemeRuntime with a full --dsw-* token dictionary derived from the
 *    DreamSkin palette (text #352970, highlight #455b78, accent #7a4e29,
 *    accentAlt #ceb683, secondary #85c1cc, panel #abb4cf/#c3cee4, background
 *    #bd9999). The runtime presenter applies the tokens as body inline
 *    variables, so every alias/specific token in the UI follows the palette.
 *  - Layers the whale-girl artwork as an ambient fixed wallpaper behind a
 *    frosted UI: surfaces keep small alpha so the art shows through, and the
 *    app frame gets a backdrop blur. Gated on the body attribute
 *    `data-dsh-whalegirl` so nothing leaks when the plugin is off.
 *  - Ports the intent of the DreamSkin `theme.css` safe-css: frosted sidebar,
 *    coffee-accent composer focus ring, plus soft selection/scrollbar polish.
 *
 * Selection semantics follow the skin model: activating the plugin pins the
 * theme via theme.setTheme(), and a `theme/change` guard re-asserts it
 * whenever anything else (the built-in Appearance scope, other plugins)
 * writes another preference. Switching appearance = toggling the plugin in
 * the market Themes tab.
 */

const THEME_ID = "deepseek-whalegirl";
const BODY_ATTR = "data-dsh-whalegirl";
const STYLE_TAG_ID = "dsh-whalegirl-skin";

/**
 * Ambient whale-girl artwork, injected by scripts/build.mjs from
 * assets/background.jpg as a data URI so the theme works from any install
 * source (npm tarball, GitHub release, git) without asset-serving support.
 */
const BACKGROUND_DATA_URI = "__WHALEGIRL_BACKGROUND_DATA_URI__";

/* ------------------------------------------------------------------ *
 * Color helpers (no dependencies — runs inside the ModuleLoader bundle)
 * ------------------------------------------------------------------ */

function hexToRgb(hex) {
	const v = hex.replace("#", "");
	if (v.length === 3) {
		return [
			parseInt(v[0] + v[0], 16),
			parseInt(v[1] + v[1], 16),
			parseInt(v[2] + v[2], 16)
		];
	}
	return [
		parseInt(v.slice(0, 2), 16),
		parseInt(v.slice(2, 4), 16),
		parseInt(v.slice(4, 6), 16)
	];
}

function clamp255(n) {
	return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex(rgb) {
	return (
		"#" +
		rgb.map((n) => clamp255(n).toString(16).padStart(2, "0")).join("")
	);
}

/** Mix color a into b; t = 0 → a, t = 1 → b. */
function mix(a, b, t) {
	const ca = hexToRgb(a);
	const cb = hexToRgb(b);
	return toHex([
		ca[0] + (cb[0] - ca[0]) * t,
		ca[1] + (cb[1] - ca[1]) * t,
		ca[2] + (cb[2] - ca[2]) * t
	]);
}

/** Hex (#rrggbb) → 8-digit hex (#rrggbbaa) with alpha 0..1. */
function alpha(hex, a) {
	const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
		.toString(16)
		.padStart(2, "0");
	return toHex(hexToRgb(hex)) + v;
}

/* ------------------------------------------------------------------ *
 * Palette — anchors straight from the DreamSkin package's theme.json
 * ------------------------------------------------------------------ */

const INK = "#352970"; // text — deep violet-indigo
const MUTED_INK = "#241d4f"; // text family dark end (from muted #030303 pulled toward ink hue)
const HIGHLIGHT = "#455b78"; // highlight slate blue — brand primary
const ACCENT = "#7a4e29"; // accent coffee brown
const SAND = "#ceb683"; // accentAlt sand — soft warm highlights
const TEAL = "#85c1cc"; // secondary soft teal — info/blue ladder anchor
const ROSE = "#bd9999"; // background key tone — bubbles & washes
const PANEL = "#abb4cf"; // panel periwinkle — sidebar glass
const PANEL_ALT = "#c3cee4"; // panelAlt lighter periwinkle
const LINE = "#d3d3d4"; // hairline gray

/** Near-white paper carrying the rose tint of the wallpaper (#bd9999 lifted). */
const PAPER = mix("#ffffff", ROSE, 0.09);

/* ------------------------------------------------------------------ *
 * Token ladders
 * ------------------------------------------------------------------ */

/**
 * Neutral-bluish ramp: PAPER → INK. Percentages calibrate each step against
 * the luminance ordering of the stock light ladder so every consumer of the
 * ladder (labels, surfaces, borders, toasts…) lands at a sensible tone.
 */
const BLUISH_STEPS = [
	["00", 0],
	["50", 0.04],
	["60", 0.06],
	["75", 0.1],
	["100", 0.15],
	["150", 0.21],
	["200", 0.28],
	["250", 0.33],
	["300", 0.4],
	["400", 0.51],
	["500", 0.61],
	["550", 0.66],
	["600", 0.71],
	["700", 0.77],
	["750", 0.81],
	["800", 0.85],
	["850", 0.89],
	["875", 0.92],
	["900", 0.94],
	["950", 0.97],
	["1000", 1]
];

/** Pure-neutral ramp for scrollbars/multi-select: white → muted ink. */
const NEUTRAL_STEPS = [
	["00", 0],
	["50", 0.03],
	["100", 0.08],
	["150", 0.13],
	["200", 0.19],
	["250", 0.23],
	["300", 0.29],
	["400", 0.39],
	["500", 0.49],
	["550", 0.54],
	["600", 0.59],
	["700", 0.66],
	["800", 0.74],
	["850", 0.79],
	["900", 0.84],
	["1000", 1]
];

/** Multi-stop ramp sampler: positions[] in [0,1] across stops [t, color][]. */
function sampleRamp(stops, position) {
	for (let i = 1; i < stops.length; i++) {
		const [t1, c1] = stops[i];
		const [t0, c0] = stops[i - 1];
		if (position <= t1) {
			const span = t1 - t0 || 1;
			return mix(c0, c1, (position - t0) / span);
		}
	}
	return stops[stops.length - 1][1];
}

/** Blue/deepseek family: white → pale teal → TEAL → deep slate-teal → navy. */
const BLUE_STOPS = [
	[0, "#ffffff"],
	[0.22, mix("#ffffff", TEAL, 0.55)],
	[0.45, TEAL],
	[0.62, "#5593a8"],
	[0.78, "#33606f"],
	[1, "#203c47"]
];

/** Warm sand/amber family built from SAND → ACCENT. */
const AMBER_STOPS = [
	[0, "#ffffff"],
	[0.45, SAND],
	[0.62, mix(SAND, ACCENT, 0.45)],
	[1, mix(ACCENT, "#241505", 0.35)]
];

/** Soft sage green family (success states), desaturated for the pastel mood. */
const GREEN_STOPS = [
	[0, "#ffffff"],
	[0.5, "#8fc7a6"],
	[0.68, "#57a37b"],
	[1, "#1f3a2b"]
];

/** Dusty rose-red family (error states), keyed to ROSE instead of pure red. */
const RED_STOPS = [
	[0, "#ffffff"],
	[0.38, "#eecdd3"],
	[0.58, "#cf8492"],
	[0.75, "#b0556a"],
	[1, "#41141f"]
];

function buildTokens() {
	const t = {};

	for (const [step, pos] of BLUISH_STEPS) {
		t[`--dsw-static-neutral-bluish-${step}`] = mix(PAPER, INK, pos);
	}
	for (const [step, pos] of NEUTRAL_STEPS) {
		t[`--dsw-static-neutral-${step}`] = mix("#ffffff", MUTED_INK, pos);
	}
	const blueSteps = [
		["50", 0.07],
		["50p", 0.1],
		["75", 0.14],
		["100", 0.18],
		["300", 0.32],
		["400", 0.48],
		["450", 0.56],
		["500", 0.63],
		["600", 0.72],
		["800", 0.85],
		["900", 0.92],
		["950", 0.97]
	];
	for (const [step, pos] of blueSteps) {
		t[`--dsw-static-blue-${step}`] = sampleRamp(BLUE_STOPS, pos);
		t[`--dsw-static-deepseek-${step}`] = sampleRamp(BLUE_STOPS, Math.max(0.05, pos - 0.03));
	}
	t["--dsw-static-deepseek-200"] = mix(PANEL_ALT, "#ffffff", 0.25);
	t["--dsw-static-deepseek-700-delete"] = sampleRamp(BLUE_STOPS, 0.76);

	const amberSteps = [["100", 0.12], ["400", 0.42], ["500", 0.52], ["600", 0.64], ["900", 0.95]];
	for (const [step, pos] of amberSteps) t[`--dsw-static-amber-${step}`] = sampleRamp(AMBER_STOPS, pos);
	const greenSteps = [["100", 0.12], ["400", 0.42], ["500", 0.56], ["900", 0.95]];
	for (const [step, pos] of greenSteps) t[`--dsw-static-green-${step}`] = sampleRamp(GREEN_STOPS, pos);
	const redSteps = [["50", 0.05], ["100", 0.1], ["400", 0.44], ["500", 0.58], ["600", 0.68], ["900", 0.95]];
	for (const [step, pos] of redSteps) t[`--dsw-static-red-${step}`] = sampleRamp(RED_STOPS, pos);

	/* Aliases — translucent surfaces let the ambient wallpaper glow through. */
	const bgBase = alpha(PAPER, 0.8);
	const layer1 = alpha(mix(PAPER, "#ffffff", 0.35), 0.86);
	const layer2 = alpha(mix(PAPER, "#ffffff", 0.5), 0.91);
	const layer3 = alpha(mix(PAPER, "#ffffff", 0.62), 0.95);
	const overlay = alpha(mix(PAPER, "#ffffff", 0.72), 0.96);

	t["--dsw-alias-bg-base"] = bgBase;
	t["--dsw-alias-bg-layer-1"] = layer1;
	t["--dsw-alias-bg-layer-2"] = layer2;
	t["--dsw-alias-bg-layer-3"] = layer3;
	t["--dsw-alias-bg-overlay"] = overlay;
	t["--dsw-alias-bg-module-platform"] = alpha(mix(PANEL, "#ffffff", 0.45), 0.82);
	t["--dsw-alias-bg-multi-select"] = alpha(mix(PANEL, "#ffffff", 0.5), 0.85);
	t["--dsw-alias-bg-skeleton"] = alpha(INK, 0.06);
	t["--dsw-alias-bg-mask-1"] = alpha(INK, 0.42);
	t["--dsw-alias-bg-mask-2"] = alpha(INK, 0.24);
	t["--dsw-alias-bg-mask-3"] = alpha(INK, 0.55);
	t["--dsw-alias-bg-mask-photo"] = alpha("#171129", 0.88);
	t["--dsw-alias-bg-mask-drop"] = alpha(PAPER, 0.72);

	t["--dsw-alias-border-inverted"] = alpha("#ffffff", 0.14);
	t["--dsw-alias-border-inverted2"] = alpha("#ffffff", 0.08);
	t["--dsw-alias-border-l1"] = alpha(LINE, 0.55);
	t["--dsw-alias-border-l2"] = alpha(LINE, 0.9);
	t["--dsw-alias-border-l2-darkmode-thin"] = alpha(LINE, 0.45);
	t["--dsw-alias-border-l3"] = alpha(mix(LINE, PANEL, 0.5), 1);
	t["--dsw-alias-border-l4"] = alpha(mix(LINE, PANEL, 0.75), 1);

	t["--dsw-alias-brand-primary"] = HIGHLIGHT;
	t["--dsw-alias-brand-primary-invert"] = mix("#ffffff", PAPER, 0.4);
	t["--dsw-alias-brand-primary-new-colorprimary-new-color"] = mix(HIGHLIGHT, TEAL, 0.45);
	t["--dsw-alias-brand-text"] = mix(INK, HIGHLIGHT, 0.35);

	t["--dsw-alias-button-primary-fill"] = HIGHLIGHT;
	t["--dsw-alias-button-primary-hover"] = mix(HIGHLIGHT, "#ffffff", 0.14);
	t["--dsw-alias-button-primary-dimmed"] = alpha(HIGHLIGHT, 0.14);
	t["--dsw-alias-button-contrast-fill"] = mix(INK, HIGHLIGHT, 0.5);
	t["--dsw-alias-button-elevated-fill"] = alpha(mix("#ffffff", PAPER, 0.5), 0.94);
	t["--dsw-alias-button-floating-fill"] = alpha(mix("#ffffff", PAPER, 0.35), 0.94);
	t["--dsw-alias-button-floating-hover"] = alpha(mix("#ffffff", PAPER, 0.2), 0.97);
	t["--dsw-alias-button-ghost-active-border"] = alpha(PANEL, 1);
	t["--dsw-alias-button-ghost-active-fill"] = alpha(mix(PANEL, "#ffffff", 0.55), 0.6);
	t["--dsw-alias-button-ghost-active-hover"] = alpha(mix(PANEL, "#ffffff", 0.4), 0.7);
	t["--dsw-alias-button-info-fill"] = t["--dsw-static-blue-500"];
	t["--dsw-alias-button-info-hover"] = t["--dsw-static-blue-400"];
	t["--dsw-alias-button-tool-bar-fill"] = alpha(mix(PANEL, "#545557", 0.35), 0.55);
	t["--dsw-alias-button-tool-bar-fill-invisible"] = alpha(INK, 0.3);
	t["--dsw-alias-button-tool-bar-hover"] = alpha(mix(PANEL, "#545557", 0.35), 0.65);

	t["--dsw-alias-interactive-bg-hover"] = alpha(HIGHLIGHT, 0.07);
	t["--dsw-alias-interactive-bg-hover-accent"] = alpha(ACCENT, 0.13);
	t["--dsw-alias-interactive-bg-hover-danger"] = alpha(t["--dsw-static-red-400"], 0.12);
	t["--dsw-alias-interactive-bg-hover-solid"] = alpha(mix(PANEL, "#ffffff", 0.35), 0.9);
	t["--dsw-alias-interactive-bg-active"] = alpha(HIGHLIGHT, 0.13);

	t["--dsw-alias-label-primary"] = INK;
	t["--dsw-alias-label-primary-bluish"] = sampleRamp(BLUE_STOPS, 0.93);
	t["--dsw-alias-label-primary-dimmed"] = mix(INK, PAPER, 0.3);
	t["--dsw-alias-label-primary-foreground"] = mix("#ffffff", PAPER, 0.4);
	t["--dsw-alias-label-primary-inverted"] = mix("#ffffff", PAPER, 0.4);
	t["--dsw-alias-label-secondary"] = t["--dsw-static-neutral-bluish-700"];
	t["--dsw-alias-label-tertiary"] = t["--dsw-static-neutral-bluish-600"];
	t["--dsw-alias-label-caption"] = t["--dsw-static-neutral-bluish-500"];
	t["--dsw-alias-label-dimmed"] = t["--dsw-static-neutral-bluish-300"];

	t["--dsw-alias-markdown-citation"] = alpha(PANEL, 0.35);
	t["--dsw-alias-markdown-code-block"] = alpha(mix(PANEL_ALT, "#ffffff", 0.55), 0.9);
	t["--dsw-alias-markdown-code-block-banner"] = alpha(mix(PANEL_ALT, "#ffffff", 0.4), 0.92);
	t["--dsw-alias-markdown-code-segment-selected"] = alpha("#ffffff", 0.85);
	t["--dsw-alias-markdown-code-segment-unselected"] = alpha(mix(PANEL_ALT, "#ffffff", 0.3), 0.75);
	t["--dsw-alias-markdown-inline-code"] = alpha(TEAL, 0.2);
	t["--dsw-alias-markdown-placeholder"] = t["--dsw-static-neutral-bluish-300"];
	t["--dsw-alias-markdown-tag"] = alpha(SAND, 0.4);

	t["--dsw-alias-scrollbar-bg-l1"] = t["--dsw-static-neutral-200"];
	t["--dsw-alias-scrollbar-bg-l2"] = t["--dsw-static-neutral-200"];
	t["--dsw-alias-scrollbar-hover-l1"] = t["--dsw-static-neutral-300"];
	t["--dsw-alias-scrollbar-hover-l2"] = t["--dsw-static-neutral-300"];

	t["--dsw-alias-state-business-primary"] = t["--dsw-static-deepseek-450"];
	t["--dsw-alias-state-business-tertiary"] = alpha(PANEL_ALT, 0.55);
	t["--dsw-alias-state-error-primary"] = t["--dsw-static-red-600"];
	t["--dsw-alias-state-error-secondary"] = t["--dsw-static-red-400"];
	t["--dsw-alias-state-success-primary"] = t["--dsw-static-green-500"];
	t["--dsw-alias-state-success-secondary"] = t["--dsw-static-green-400"];
	t["--dsw-alias-state-success-tertiary"] = t["--dsw-static-green-100"];
	t["--dsw-alias-state-warn-label"] = t["--dsw-static-amber-600"];
	t["--dsw-alias-state-warn-primary"] = t["--dsw-static-amber-500"];
	t["--dsw-alias-state-warn-secondary"] = t["--dsw-static-amber-400"];
	t["--dsw-alias-state-warn-tertiary"] = t["--dsw-static-amber-100"];

	t["--dsw-alias-toast-bg"] = alpha(t["--dsw-static-neutral-bluish-850"], 0.96);
	t["--dsw-alias-tooltip-bg"] = alpha(t["--dsw-static-neutral-bluish-800"], 0.96);

	/* Specifics — the signature Whale Girl touches. */
	t["--dsw-specific-sidebar-fill"] = alpha(PANEL, 0.34); // periwinkle glass over wallpaper
	t["--dsw-specific-sidebar-nav-item-active"] = alpha(mix("#ffffff", PANEL, 0.25), 0.66);
	t["--dsw-specific-sidebar-nav-item-active-accent"] = SAND;
	t["--dsw-specific-sidebar-nav-item-hover"] = alpha(mix("#ffffff", PANEL, 0.15), 0.5);
	t["--dsw-specific-bubble"] = alpha(ROSE, 0.34); // dusty-rose user bubbles
	t["--dsw-specific-bubble-highlight"] = alpha(mix(ROSE, SAND, 0.35), 0.45);
	t["--dsw-specific-input-major"] = alpha(mix("#ffffff", PAPER, 0.3), 0.78);
	t["--dsw-specific-login-input"] = alpha(mix("#ffffff", PAPER, 0.5), 0.9);
	t["--dsw-specific-menu"] = alpha(mix("#ffffff", PANEL_ALT, 0.35), 0.97);
	t["--dsw-specific-selector"] = alpha(mix("#ffffff", PANEL_ALT, 0.45), 0.94);
	t["--dsw-specific-tip"] = alpha(mix("#ffffff", PANEL_ALT, 0.4), 0.92);

	/* Shadows & gradients, violet-keyed instead of pure black. */
	t["--dsw-shadow-lv1"] = `0 2px 4px 0 ${alpha(INK, 0.06)}`;
	t["--dsw-shadow-lv1-blur"] = `0 4px 12px 0 ${alpha(INK, 0.05)}`;
	t["--dsw-shadow-lv2"] = `0 4px 12px 0 ${alpha(INK, 0.05)}, 0 2px 8px 0 ${alpha(INK, 0.06)}`;
	t["--dsw-shadow-lv3"] = `0 2px 4px 0 ${alpha(INK, 0.04)}, 0 0 4px 0 ${alpha(INK, 0.03)}, 0 12px 32px 0 ${alpha(INK, 0.13)}`;
	t["--dsw-linear-gradient-think"] = `linear-gradient(180deg, ${mix("#ffffff", PAPER, 0.5)} 20.19%, ${alpha(PAPER, 0)} 100%)`;
	t["--dsw-linear-think-select"] = `linear-gradient(180deg, ${mix("#ffffff", PANEL_ALT, 0.35)} 20.19%, ${alpha(PANEL_ALT, 0)} 100%)`;
	t["--dsw-mask-blur"] = "blur(2px)";

	return t;
}

const TOKENS = buildTokens();

/* ------------------------------------------------------------------ *
 * Skin stylesheet — everything gated on the body attribute
 * ------------------------------------------------------------------ */

const SKIN_CSS = `
body[${BODY_ATTR}] {
  background-color: ${PAPER};
}
body[${BODY_ATTR}]::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: url("${BACKGROUND_DATA_URI}");
  background-size: cover;
  background-position: 50% 50%;
  background-repeat: no-repeat;
}
/* Soft paper veil so text keeps contrast over busy areas of the artwork. */
body[${BODY_ATTR}]::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(180deg, ${alpha(PAPER, 0.34)} 0%, ${alpha(PAPER, 0.1)} 45%, ${alpha(PAPER, 0.22)} 100%);
}
body[${BODY_ATTR}] [id="root"] {
  background: transparent;
}
/* The three-column app frame carries a CSS-module class ending in _frame. */
body[${BODY_ATTR}] [class$="_frame"] {
  background-color: transparent;
  backdrop-filter: blur(18px) saturate(1.05);
  -webkit-backdrop-filter: blur(18px) saturate(1.05);
}
/* Frosted sidebar surface (intent of the DreamSkin safe-css block). */
body[${BODY_ATTR}] [role="tree"] {
  border-radius: 14px;
}
body[${BODY_ATTR}] [role="treeitem"] {
  border-radius: 12px;
  transition: background-color 0.14s ease, box-shadow 0.14s ease;
}
body[${BODY_ATTR}] [role="treeitem"][aria-selected="true"] {
  box-shadow: inset 3px 0 0 var(--dsw-specific-sidebar-nav-item-active-accent);
}
/* Coffee-accent composer focus ring (DreamSkin composer:focus-visible). */
body[${BODY_ATTR}] :is(textarea, [contenteditable="true"], input:not([type])):focus-visible {
  border-color: ${ACCENT};
  outline: none;
  box-shadow: 0 0 0 3px ${alpha(ACCENT, 0.18)};
}
body[${BODY_ATTR}] ::selection {
  background: ${alpha(SAND, 0.55)};
  color: ${INK};
}
@media print {
  body[${BODY_ATTR}]::before,
  body[${BODY_ATTR}]::after { display: none; }
}
`;

/* ------------------------------------------------------------------ *
 * Skin stylesheet injection
 * ------------------------------------------------------------------ */

function injectStyle() {
	let tag = document.getElementById(STYLE_TAG_ID);
	if (tag !== null) return tag;
	tag = document.createElement("style");
	tag.id = STYLE_TAG_ID;
	tag.dataset.plugin = "dsh-theme-whalegirl";
	tag.textContent = SKIN_CSS;
	document.head.appendChild(tag);
	return tag;
}

function resolveTheme(ctx) {
	if (ctx.theme !== undefined && ctx.theme !== null) return ctx.theme;
	if (typeof ctx.get === "function") {
		const service = ctx.get("theme");
		if (service !== undefined && service !== null) return service;
	}
	throw new Error("dsh-theme-whalegirl: theme service not found");
}

/* ------------------------------------------------------------------ *
 * Plugin entry
 * ------------------------------------------------------------------ */

function apply(ctx) {
	ctx.effect(() => {
		document.body.setAttribute(BODY_ATTR, "");
		const styleTag = injectStyle();

		const theme = resolveTheme(ctx);
		const disposeRegister = theme.register({
			id: THEME_ID,
			colorScheme: "light",
			tokens: TOKENS
		});
		try {
			theme.setTheme(THEME_ID);
		} catch (error) {
			console.error("dsh-theme-whalegirl: setTheme failed", error);
		}

		// Guard: the built-in Appearance scope re-applies its stored preference —
		// explicit light/dark or the "system" default — on settings reloads, and
		// any such write would silently drop this theme's tokens. While the
		// plugin is enabled the whale-girl look IS the appearance, so re-assert
		// unconditionally; switching to another theme means disabling the plugin
		// in the market Themes tab (which also restores the built-in behavior).
		const offChange =
			typeof ctx.on === "function"
				? ctx.on("theme/change", (snapshot) => {
						const preference = snapshot && snapshot.preference;
						if (typeof preference !== "string" || preference === THEME_ID) return;
						try {
							theme.setTheme(THEME_ID);
						} catch {
							/* not registered yet — the next change event retries */
						}
					})
				: null;

		return () => {
			if (offChange !== null) offChange();
			disposeRegister();
			styleTag.remove();
			document.body.removeAttribute(BODY_ATTR);
		};
	}, "dsh-theme-whalegirl: register");
}

exports.isPlugin = true;
exports.inject = ["theme"];
exports.apply = apply;
