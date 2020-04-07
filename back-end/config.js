const config = {}

config.port = 8082
// 'postgres://<username>:<password>@localhost/<database>'
config.dbConnStr = 'postgres://use_easy_authn:password@localhost/use_easy_authn'

// EasyAuthn config
// Service Secret Key (SSK)
config.ssk = 'cb1a39b2f6400c0dd94ef2c872665cce'

module.exports = config
