var request = require('request')

module.exports = function (apiKey) {
  return function validator (email, cb) {
    const func = this.validator;

    if (cb === undefined) {
      return new Promise(function (resolve, reject) {
        func(email, function (err, result) {
          err ? reject(err) : resolve(result)
        })
      })
    }

    var options = {
      url: 'https://api.mailgun.net/v2/address/validate',
      method: 'GET',
      timeout: 4000,
      qs: {
        address: email
      },
      auth: {
        username: 'api',
        password: apiKey
      }
    }
    request(options, function (err, res) {
      if (err) {
        return cb(err)
      }
      try {
        var result = JSON.parse(res.request.response.body)
        cb(null, result)
      } catch (err) {
        console.log("Unable to Parse MailGun Response: " + res.request.response.body);
        cb(err)
      }
    })
  }
}
