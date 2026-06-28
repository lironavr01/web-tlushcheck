// Tiny indirection so tab modules can request a re-render of the active tab
// without importing app.js (which would create a circular dependency).
let _rerender = () => {};
export const setRerender = (fn) => {
  _rerender = fn;
};
export const rerender = () => _rerender();
