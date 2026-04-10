export function usePremium() {
  // DEV MODE: bypass premium gate — revert by removing this early return
  return { isPremium: true };
  // return { isPremium: false };
}
