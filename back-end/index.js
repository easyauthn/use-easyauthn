const config = require('./config')
process.env.NODE_ENV = 'develop'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const express = require('express')
const app = express()
const http = require('http').Server(app)
const bodyParser = require('body-parser')
const pg = require('pg')
const crypto = require('crypto')
const EasyAuthn = require('easyauthn')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')
  next()
})

http.listen(config.port, 'localhost', () => console.log(`Server running on ${config.port}...`))

app.post('/create', async (req, res) => {
  let db
  let out
  try {
    const data = JSON.parse(req.body.data)
    db = new pg.Client(config.dbConnStr)
    db.connect()
    const result =
      await db.query(`insert into accounts (username, password, session_id, easyauthn_user_id, login_token) 
        values ($1, $2, $3, $4, $5) returning *`,
      [data.username,
        data.password,
        crypto.randomBytes(15).toString('hex'),
        crypto.randomBytes(15).toString('hex'),
        crypto.randomBytes(15).toString('hex')])
    if (result.rows.length !== 1) throw new Error()
    out = { status: 'success', sessionId: result.rows[0].session_id }
  } catch (err) {
    out = { status: 'error', msg: 'Cannot create a user with this username. Try another one!' }
  } finally {
    if (db) await db.end()
  }
  return res.send(out)
})

app.post('/get-easyauth-creds', async (req, res) => {
  let db
  let out
  try {
    const data = JSON.parse(req.body.data)
    db = new pg.Client(config.dbConnStr)
    db.connect()

    const result = await db.query('select * from accounts where session_id = $1', [data.sessionId])
    if (result.rows.length !== 1) {
      const sessionNotExistError = new Error()
      sessionNotExistError.code = 'session-not-exists'
      throw sessionNotExistError
    }

    const easyAuthn = new EasyAuthn()
    easyAuthn.ssk = config.ssk
    easyAuthn.userId = result.rows[0].easyauthn_user_id
    const easyAuthnResult = await easyAuthn.getUserCredentials()
    if (easyAuthnResult.status === 200 && easyAuthnResult.data.status === 'ok') {
      out = {
        status: 'success',
        username: result.rows[0].username,
        credentials: easyAuthnResult.data.credentials
      }
    } else {
      console.log(easyAuthnResult)
      throw new Error()
    }
  } catch (err) {
    console.log(err)
    out = { status: 'error', code: err.code }
  } finally {
    if (db) await db.end()
  }
  return res.send(out)
})

app.post('/delete-easyauth-cred', async (req, res) => {
  let db
  let out
  try {
    const data = JSON.parse(req.body.data)
    db = new pg.Client(config.dbConnStr)
    db.connect()

    const result = await db.query('select * from accounts where session_id = $1', [data.sessionId])
    if (result.rows.length !== 1) {
      const sessionNotExistError = new Error()
      sessionNotExistError.code = 'session-not-exists'
      throw sessionNotExistError
    }

    const easyAuthn = new EasyAuthn()
    easyAuthn.ssk = config.ssk
    easyAuthn.userId = result.rows[0].easyauthn_user_id
    easyAuthn.credentialId = data.credId
    const easyAuthnResult = await easyAuthn.deleteUserCredential()
    if (easyAuthnResult.status === 200 && easyAuthnResult.data.status === 'ok') {
      out = { status: 'success' }
    } else {
      console.log(easyAuthnResult)
      throw new Error()
    }
  } catch (err) {
    console.log(err)
    out = { status: 'error', code: err.code }
  } finally {
    if (db) await db.end()
  }
  return res.send(out)
})

app.post('/new-easyauth-creds', async (req, res) => {
  let db
  let out
  try {
    const data = JSON.parse(req.body.data)
    db = new pg.Client(config.dbConnStr)
    db.connect()

    const result = await db.query('select * from accounts where session_id = $1', [data.sessionId])
    if (result.rows.length !== 1) {
      const sessionNotExistError = new Error()
      sessionNotExistError.code = 'session-not-exists'
      throw sessionNotExistError
    }

    const easyAuthn = new EasyAuthn()
    easyAuthn.ssk = config.ssk
    easyAuthn.userId = result.rows[0].easyauthn_user_id
    const easyAuthnResult = await easyAuthn.requestUserRegistration()
    if (easyAuthnResult.status === 200 && easyAuthnResult.data.status === 'ok') {
      out = {
        status: 'success',
        username: result.rows[0].username,
        registrationUrl: easyAuthnResult.data.registrationUrl,
        qrRegistrationUrl: easyAuthnResult.data.qrRegistrationUrl,
        statusRoom: easyAuthnResult.data.statusRoom
      }
    } else {
      console.log(easyAuthnResult)
      throw new Error()
    }
  } catch (err) {
    console.log(err)
    out = { status: 'error', code: err.code }
  } finally {
    if (db) await db.end()
  }
  return res.send(out)
})

app.post('/sign-in', async (req, res) => {
  let db
  let out
  try {
    const data = JSON.parse(req.body.data)
    db = new pg.Client(config.dbConnStr)
    db.connect()
    const result =
      await db.query('select * from accounts where username = $1 and password = $2',
        [data.username, data.password])
    if (result.rows.length !== 1) throw new Error()
    out = { status: 'success', loginToken: result.rows[0].login_token }
  } catch (err) {
    out = { status: 'error', msg: 'Wrong username or password. Try another one!' }
  } finally {
    if (db) await db.end()
  }
  return res.send(out)
})

app.post('/sign-in-verification', async (req, res) => {
  let db
  let out
  try {
    const data = JSON.parse(req.body.data)
    db = new pg.Client(config.dbConnStr)
    db.connect()
    const result =
      await db.query('select * from accounts where login_token = $1', [data.loginToken])
    if (result.rows.length !== 1) throw new Error()

    const easyAuthn = new EasyAuthn()
    easyAuthn.ssk = config.ssk
    easyAuthn.userId = result.rows[0].easyauthn_user_id
    const easyAuthnResult = await easyAuthn.requestInstanceIdUrl()
    if (easyAuthnResult.status === 200 && easyAuthnResult.data.status === 'ok') {
      out = {
        status: 'success',
        to_verify: true,
        username: result.rows[0].username,
        url: easyAuthnResult.data.url,
        urlQr: easyAuthnResult.data.urlQr,
        instanceId: easyAuthnResult.data.instanceId,
        statusRoom: easyAuthnResult.data.statusRoom
      }
    } else if (easyAuthnResult.status === 200 &&
      easyAuthnResult.data.status === 'client_error' &&
      (easyAuthnResult.data.code === 'CE24' || easyAuthnResult.data.code === 'CE22')) {
      out = {
        status: 'success',
        to_verify: false,
        username: result.rows[0].username
      }
    } else {
      console.log(easyAuthnResult)
      throw new Error()
    }
  } catch (err) {
    out = { status: 'error' }
  } finally {
    if (db) await db.end()
  }
  return res.send(out)
})

app.post('/sign-in-verification-continue', async (req, res) => {
  let db
  let out
  try {
    const data = JSON.parse(req.body.data)
    db = new pg.Client(config.dbConnStr)
    db.connect()
    const result =
      await db.query('select * from accounts where login_token = $1', [data.loginToken])
    if (result.rows.length !== 1) throw new Error()

    const easyAuthn = new EasyAuthn()
    easyAuthn.ssk = config.ssk
    easyAuthn.userId = result.rows[0].easyauthn_user_id
    const easyAuthnResultCredentials = await easyAuthn.doesUserHaveCredentials()
    if (easyAuthnResultCredentials.status === 200 && easyAuthnResultCredentials.data.status === 'ok') {
      if (easyAuthnResultCredentials.data.credentials) {
        if (data.instanceId) {
          easyAuthn.instanceId = data.instanceId
          const easyAuthnResultCredentials = await easyAuthn.isInstanceIdAuthn()
          if (easyAuthnResultCredentials.status === 200 &&
              easyAuthnResultCredentials.data.status === 'ok' &&
              easyAuthnResultCredentials.data.authn === true) {
            out = { status: 'success', sessionId: result.rows[0].session_id }
          } else {
            out = { status: 'error' }
          }
        } else {
          out = { status: 'error' }
        }
      } else {
        out = { status: 'success', sessionId: result.rows[0].session_id }
      }
    } else {
      throw new Error()
    }
  } catch (err) {
    out = { status: 'error' }
  } finally {
    if (db) await db.end()
  }
  return res.send(out)
})
