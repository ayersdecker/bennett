import {
  GoogleAuthProvider,
  linkWithPopup,
  reauthenticateWithPopup,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { MCPKit } from '../mcp/registry';

const GOOGLE_SCOPE_PREFIX = 'https://www.googleapis.com/auth/';

export function supportsOAuthHandoff(kit: MCPKit) {
  return kit.requiresOAuth && kit.category === 'google';
}

function createGoogleScopedProvider(kit: MCPKit) {
  const provider = new GoogleAuthProvider();

  for (const scope of kit.oauthScopes || []) {
    const normalizedScope = scope.startsWith('https://') ? scope : `${GOOGLE_SCOPE_PREFIX}${scope}`;
    provider.addScope(normalizedScope);
  }

  provider.setCustomParameters({
    prompt: 'consent',
  });

  return provider;
}

export async function connectOAuthKit(kit: MCPKit) {
  if (!supportsOAuthHandoff(kit)) {
    throw new Error(`OAuth handoff is not available for ${kit.name}.`);
  }

  const provider = createGoogleScopedProvider(kit);
  const currentUser = auth.currentUser;

  let result;
  if (!currentUser) {
    result = await signInWithPopup(auth, provider);
  } else if (currentUser.providerData.some((entry) => entry.providerId === 'google.com')) {
    result = await reauthenticateWithPopup(currentUser, provider);
  } else {
    result = await linkWithPopup(currentUser, provider);
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);
  return {
    oauthToken: credential?.accessToken,
  };
}