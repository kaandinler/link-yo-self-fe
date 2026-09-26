export const IS_SIGN_UP_ENABLED =
  process.env.NEXT_PUBLIC_IS_SIGN_UP_ENABLED === "true";

// AUTH_TOKEN_KEY buradan kaldirildi: token artik istemcide bir cerez
// adiyla saklanmiyor. Eski adin tek kaldigi yer cookie-names.ts ve
// orada yalnizca SILMEK icin duruyor.
