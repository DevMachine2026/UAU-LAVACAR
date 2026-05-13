type AuthSessionHandlers = {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
};

let handlers: AuthSessionHandlers = {
  getAccessToken: () => null,
  onUnauthorized: () => undefined
};

export function configureAuthSession(nextHandlers: AuthSessionHandlers) {
  handlers = nextHandlers;
}

export function getAuthAccessToken() {
  return handlers.getAccessToken();
}

export function handleUnauthorizedSession() {
  handlers.onUnauthorized();
}
