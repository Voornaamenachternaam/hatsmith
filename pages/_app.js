import Head from "next/head";
import { getTranslations as t } from "../locales";
import "../public/assets/styles/style.css";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../src/utils/createEmotionCache';
import { Theme, checkTheme } from "../src/config/Theme";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

//check wether the user prefers/chose dark theme
if (typeof window !== 'undefined') {
  checkTheme();
}

function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>
          {`Hatsmith - ${t("sub_title")}`}
        </title>
        <link rel="icon" href="/assets/images/logo_new.png" />

        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Encrypt and Decrypt files securely in your browser."
        />
        <meta
          name="Keywords"
          content="encrypt decrypt encryption file-encryption javascript client-side serverless decryption xchcha20 argon2id encryption-decryption webcrypto crypto browser in-browser"
        />
        <meta
          name="theme-color"
          content="#fafafa"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#1c1c1c"
          media="(prefers-color-scheme: dark)"
        />
      </Head>
      <ThemeProvider theme={Theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  );
}

export default MyApp;
