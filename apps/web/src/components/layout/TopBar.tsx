/**
 * TopBar is intentionally minimal now that the sidebar handles
 * primary navigation and the user account card.
 *
 * On desktop (lg+) it is hidden entirely -- the sidebar is always visible.
 * On mobile (<lg) the Sidebar component renders its own mobile header,
 * so TopBar is no longer needed.
 *
 * Keeping this file as an empty export so existing imports don't break
 * during the transition. Can be removed once all references are cleaned up.
 */
export function TopBar() {
  return null;
}
