declare global {
  interface Window {
    env: {
      NG_APP_API_URL: string;
      NG_APP_WS_URL: string;
    };
  }
}

export {};