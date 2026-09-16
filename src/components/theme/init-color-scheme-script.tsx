"use client";

import InitColorSchemeScriptMui from "@mui/material/InitColorSchemeScript";

/**
 * Ilk boyamadan once renk semasini <html>'e yaziyor.
 *
 * defaultMode="dark": tema saglayicidaki defaultColorScheme ile ayni olmali.
 * Ayrisirsa sayfa bir an acik temayla boyanip sonra koyuya donuyor.
 */
function InitColorSchemeScript() {
  return <InitColorSchemeScriptMui attribute="class" defaultMode="dark" />;
}

export default InitColorSchemeScript;
