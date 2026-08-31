const test = require('node:test');
const assert = require('node:assert/strict');
const publicRoutes = require('../routes/public');

test('booking payment routes are registered', () => {
  const routePaths = publicRoutes.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => (Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path]));

  assert.ok(routePaths.includes('/booking/payment'), 'Missing /booking/payment route');
  assert.ok(routePaths.includes('/bookings/payment'), 'Missing /bookings/payment alias route');
});
