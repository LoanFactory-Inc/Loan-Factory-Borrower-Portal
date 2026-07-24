/**
 * Tracks whether the borrower portal has already been "entered" in this page
 * lifetime — i.e. whether the app-shell has mounted at least once.
 *
 * It lets a page tell a *fresh page load* apart from an *in-app navigation*:
 * on the very first render the shell's mount effect hasn't run yet (child
 * effects fire before parent effects), so a landing page sees `false`; every
 * later client navigation sees `true`. Lets a page tell an on-entry redirect
 * apart from an explicit in-app nav click.
 */
let entered = false;

export function markPortalEntered() {
  entered = true;
}

export function hasPortalBeenEntered() {
  return entered;
}
