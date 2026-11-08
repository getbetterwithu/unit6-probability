export function renderMath(el) {
  if (!el || typeof katex === 'undefined') return;
  const html = el.innerHTML;
  el.innerHTML = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    return katex.renderToString(tex, { displayMode: true, throwOnError: false });
  }).replace(/\$([^$]+)\$/g, (_, tex) => {
    return katex.renderToString(tex, { displayMode: false, throwOnError: false });
  });
}
