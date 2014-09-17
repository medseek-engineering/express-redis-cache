/**

  cache.route()
  #############

  The route to be called from Express app

**/

module.exports = function (
/* String */      name,       // The cache entry name to get
/* Number */      expire      // The cache expiration     [OPTIONAL]
) {

  /** The middleware function to return **/
  var fn;

  var self = this;

  var domain = require('domain').create();

  domain.on('error', function (error) {
    throw error;
  });

  domain.run(function () {
      
    fn = function (req, res, next) {

      var key = res.expressRedisCacheName || req.originalUrl || name;

      expire = expire || self.options.expire;
      
      /** attempt to get page **/
      self.get(key, domain.intercept(function (cache) {
        
        /** if it's cached, display cache **/
        if ( cache && cache.constructor === Object && Object.keys(cache).length ) {
          res.contentType(cache.type || "text/html");
          res.set('X-Cache', 'HIT');
          res.send(cache.body);
        }

        /** otherwise, cache request **/
        else {

          /** wrap res.send **/
          var send = res.send.bind(res);

          res.expressRedisCache = true;

          res.send = function (body) {

            /** send output to HTTP client **/

            send(body);

            if ( this.expressRedisCache && res.statusCode != 500) {
              /** Create the new cache **/
              self.add(key, body, this._headers['content-type'], expire,
                domain.intercept(function (key, cache) {
                  // self.emit('message',  require('util').format('~SET %s %d Kb', key,
                  //   (require('./sizeof')(cache) / 1024).toFixed(2)));
                }));
            }
          };

          next();
        }

      }));
    };

  });

  return fn;
};