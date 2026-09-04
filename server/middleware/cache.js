const cache = {};

const apiCache = (durationInSeconds) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache[key];

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.json(cachedResponse.data);
    } else {
      // Override res.json to capture the response
      const originalJson = res.json;
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache[key] = {
            data: body,
            expiry: Date.now() + durationInSeconds * 1000
          };
        }
        originalJson.call(res, body);
      };
      next();
    }
  };
};

module.exports = apiCache;
