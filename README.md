# use-easyauthn
In this tutorial, we'll look at how to integrate with `EasyAuthn` and to implement (Two-factor authentication). The name of the client who will integrate `EasyAuthn` is `DemoClient`. This is an example and the focus is how to integrate and use `EasyAuthn`. On your production solution you should do something better with `DemoClient` security implementation, but the `EasyAuthn` integration should be similar.

## Table of contents

1. [Setup](#setup)
2. [Config](#config)
3. [EasyAuthn Node package](#easyauthn-node-package)
4. [Create account in DemoClient](#create-account-in-democlient)
5. [Manage credentials](#manage-credentials)
6. [New credentials](#new-credentials)
7. [Sign in](#sign-in)
8. [Sign in Verification](#sign-in-verification)

## Setup

The repo contains all you need. The project is separate in two parts - `front-end` and `back-end`. Each of them is different `Node.js` project. The `back-end` project uses `postgresql` database.

First get the repo, after that install the `front-end` and `back-end` projects:
```
$ git clone https://github.com/easyauthn/use-easyauthn.git
$ use-easyauthn/back-end
$ npm install
$ cd ../front-end
$ npm install
```
In your postgres test database create user `use_easy_authn` with password `password`.
Apply `use-easyauthn/back-end/01-init.sql` to your postgres test database with user `use_easy_authn`.

Start `node index.js` for both `front-end` and `back-end` in two different terminals.
You should be able to access `http://localhost:8081/landing-page.html`.

## Config

* front-end

You can change the [port](https://github.com/easyauthn/use-easyauthn/blob/master/front-end/config.js#L3) in `use-easyauthn/front-end/config.js`.

* back-end

You can change the [port](https://github.com/easyauthn/use-easyauthn/blob/master/back-end/config.js#L3), [database connection string](https://github.com/easyauthn/use-easyauthn/blob/master/back-end/config.js#L5) and [SSK](https://github.com/easyauthn/use-easyauthn/blob/master/back-end/config.js#L9) in `use-easyauthn/back-end/config.js`.


###  Service Secret Key (SSK)

SSK is used by the `DemoClient` to present itself to the EasyAuthn. The SSK in this tutorial is for test. Dont use it in production. All data created on EasyAuthn by SSK from this tutorial will be deleted regularly. For example every 24 hours.

## EasyAuthn Node package

We are using [EasyAuthn Node package](https://github.com/easyauthn/easyauthn-node) for Node examples. You can also create your own module using [EasyAuthn API](https://github.com/easyauthn/api-doc).

## Create account in DemoClient

Account creation in `DemoClient` is not part of `EasyAuthn` integration. There is `accounts` table in `DemoClient` for that. The `front-end` is `front-end/www/create-account.html` and `back-end` is `back-end/index.js` with root `/create`. Take a look these files for more details.

## Manage credentials

The `front-end` is `front-end/www/manage-credentials.html`. It hits `get-easyauth-creds` and `delete-easyauth-cred` which are `DemoClient` routes in `back-end/index.js`. 

### `/get-easyauth-creds`

`DemoClient` should get user credentials list from `EasyAuthn`. 
```
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
```

### `/delete-easyauth-cred`

`DemoClient` can delete user credential from `EasyAuthn`.

```
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
```
`EasyAuthn` provides the opportunity to keep at least one credential. 
```
easyAuthn.keepAtLeastOne = true
```
The default value is `false`. Look at [EasyAuthn API Doc deleteUserCredential](https://github.com/easyauthn/api-doc#deleteusercredential).

## New credentials

The `front-end` is `front-end/www/new-credentials.html`. It hits `new-easyauth-creds` which is `DemoClient` route in `back-end/index.js`. 

### `/new-easyauth-creds`

`DemoClient` send user request registration to `EasyAuthn`. The user will be created if does not exist.

```
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
```
The result params:
```
username - not related with EasyAuthn integration
registrationUrl - DemoClient front-end should provide UI with the link
qrRegistrationUrl - DemoClient front-end should show the QR for scanning
statusRoom -  DemoClient front-end should use the value to init easyauthn-registration-listener-front lib
```

### `statusRoom`

`DemoClient` front-end should use the `statusRoom` value to init [easyauthn-registration-listener-front](https://github.com/easyauthn/easyauthn-registration-listener-front). The lib will listen for `EasyAuthn` registration event. 

```
  easyauthn.onStatus((status) => { 
    if (status === 'ok') successfulRegistration()
  })
  easyauthn.init(res.statusRoom)
```

## Sign in

`Sign in` in `DemoClient` is not part of `EasyAuthn` integration. The interesting moment is `login_token` which allow user to be in `Sign in Verification` mode.

## Sign in Verification

The `front-end` is `front-end/www/sign-in-verification.html`. It hits `sign-in-verification` and `sign-in-verification-continue` which are `DemoClient` routes in `back-end/index.js`.

### `/sign-in-verification`

`DemoClient` should send instance id url request.

```
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
```

There are two interesting moments. 
`EasyAuthn` can response with:
- The user is not registered in `EasyAuthn`:
```
{"status":"client_error","code":"CE22","msg":"Not valid 'ssk' and 'user_id'!"}
```
- The user is registered in `EasyAuthn` and dont have credentials:
```
{"status":"client_error","code":"CE24","msg":"User without registration!"}
```
- The user is registered in `EasyAuthn` and have credentials. In this case `DemoClient` should use the params like this:
```
  url - DemoClient front-end should provide UI with the link
  urlQr - DemoClient front-end should show the QR for scanning
  instanceId - DemoClient front-end should send it with /sign-in-verification-continue. So it can keep it in hidden param as in the example
  statusRoom - DemoClient front-end should use the value to init easyauthn-sign-in-listener-front lib
```

### `statusRoom`

`DemoClient` front-end should use the `statusRoom` value to init [easyauthn-sign-in-listener-front](https://github.com/easyauthn/easyauthn-sign-in-listener-front). The lib will listen for `EasyAuthn` sign-in event. 

```
  easyauthn.onStatus((status) => { 
    if (status === 'ok') successfulSignInVerification()
  })
  easyauthn.init(res.statusRoom)
```

### `/sign-in-verification-continue`

`DemoClient` first need to validate the user has credentials and if so to validate instance id is authenticated.
```
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
```


