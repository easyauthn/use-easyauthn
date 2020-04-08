# use-easy-authn
In this tutorial, we'll look at how to integrate with `EasyAuthn` and to implement (Two-factor authentication). The name of the client who will integrate `EasyAuthn` is `DemoClient`. This is an example and the focus is how to integrate and use `EasyAuthn`. On your production solution you should do something better with `DemoClient` security implementation, but the `EasyAuthn` integration should be similar.

## Table of contents

1. [Setup](#setup)
2. [Config](#config)

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

SSK is used by the `DemoClient` to present itself to the server. The SSK in this tutorial is for test. Dont use it in production. Users created with SSK from this tutorial will be deleted regularly. For example every 24 hours. 
