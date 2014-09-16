/**

  cache.get()
  ###########

  This script is supposed to be called via `index.js`

**/

module.exports = function (
/* RedisClient */ client,     // A Redis client
/* String */      name,       // The cache entry name to get
/* Function */    callback    // Callback
) {
  var self = this;

  var domain = require('domain').create();

  if ( typeof callback !== 'function' ) {
    throw new Error('Missing callback');
  }

  domain.on('error', function (error) {
    if (self.options.errors) return callback(error);
    if (callback) callback(null);
  });

  domain.run(function () {

    if ( typeof name !== 'string' ) {
      throw new Error('Missing name of cache to get');
    }

    /* Get cache */
    client.hgetall(self.prefix + name, domain.intercept(function (results) {

      if ( ! results ) {
        return callback(null, {});
      }

      results.name = name;

      self.emit('message', require('util').format('GET %s ~%d Kb', name,
        (require('./sizeof')(results) / 1024).toFixed(2)));
      
      callback(null, results);
    }));

  });
};