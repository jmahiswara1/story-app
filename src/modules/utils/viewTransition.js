export async function withViewTransition(root, renderFn) {
  // Prefer native View Transitions when available
  if (typeof document.startViewTransition === "function") {
    try {
      await document.startViewTransition(() => renderFn());
      return;
    } catch (_) {
      // fall through to CSS fallback
    }
  }

  // CSS fallback: simple fade transition
  root.setAttribute("data-view-transition", "");
  root.classList.remove("in");
  root.classList.add("out");
  
  // Small delay for transition effect
  await new Promise((r) => setTimeout(r, 30));
  
  // Render the new content
  const result = renderFn();
  
  // If render returns a promise, wait for it
  if (result && typeof result.then === "function") {
    try {
      await result;
    } catch (err) {
      console.error('View transition render error:', err);
    }
  }
  
  // Show the new content and re-enable clicks
  root.classList.remove("out");
  root.classList.add("in");
  root.style.pointerEvents = 'auto'; // Ensure clicks are enabled
}
