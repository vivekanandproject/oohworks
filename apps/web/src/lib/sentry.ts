/**
 * What Sentry may collect: the error and where it happened, nothing about the person. Bodies hold
 * buyers' emails and codes, query strings hold the signed keys of reply links, and cookies hold
 * sign-ins, so none of them is sent.
 */
export const PRIVATE = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
};
