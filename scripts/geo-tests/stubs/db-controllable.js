// Controllable @/db stub for the budget-guard suite.
//
// State lives on globalThis rather than being re-exported through the bundle
// entry: exporting `__state` from '@/db' made tsc fail against the REAL db
// module, which has no such member. The suite reads globalThis directly.
const state = { queue: [], throwOn: null, calls: 0 };
globalThis.__geoTestDbState = state;

export const db = {
  select() {
    return { from() { return { where() {
      state.calls++;
      if (state.throwOn === state.calls) return Promise.reject(new Error('db down'));
      return Promise.resolve(state.queue.shift() ?? []);
    } }; } };
  },
};
