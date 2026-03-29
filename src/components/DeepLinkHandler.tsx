import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { parseVerifyEmailTokenFromUrl } from '../utils/verifyEmailDeepLink';

function navigateToVerifyEmail(
  history: ReturnType<typeof useHistory>,
  url: string,
): void {
  const token = parseVerifyEmailTokenFromUrl(url);
  if (!token) return;
  history.replace(`/verify-email?token=${encodeURIComponent(token)}`);
}

/**
 * App Links / Universal Links: al abrir https://quira.app/verify-email?token=...
 * el WebView recibe la URL vía Capacitor App.
 */
const DeepLinkHandler: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleOpenUrl = (url: string) => {
      navigateToVerifyEmail(history, url);
    };

    let listener: { remove: () => Promise<void> } | undefined;

    App.addListener('appUrlOpen', ({ url }) => {
      handleOpenUrl(url);
    }).then((l) => {
      listener = l;
    });

    App.getLaunchUrl()
      .then((res) => {
        if (res?.url) handleOpenUrl(res.url);
      })
      .catch(() => {});

    return () => {
      listener?.remove().catch(() => {});
    };
  }, [history]);

  return null;
};

export default DeepLinkHandler;
