create database use_easy_authn encoding 'UTF-8';

\c use_easy_authn;

create table accounts (
  id serial primary key,
  username text not null unique,
  password text not null,
  session_id text not null unique,
  easyauthn_user_id text not null unique,
  login_token text not null unique,
  created_at timestamptz not null default now()
);