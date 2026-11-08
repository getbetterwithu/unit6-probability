export function texToHtml(tex, displayMode = false) {
  if (typeof katex === 'undefined') return tex;
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
    });
  } catch (e) {
    console.error('KaTeX render error:', e);
    return tex;
  }
}

export function renderMathString(str) {
  if (!str || typeof katex === 'undefined') return str;
  return str
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => texToHtml(tex, true))
    .replace(/\$([^$]+)\$/g, (_, tex) => texToHtml(tex, false));
}

export function renderMath(el) {
  if (!el || typeof katex === 'undefined') return;
  el.innerHTML = renderMathString(el.innerHTML);
}
