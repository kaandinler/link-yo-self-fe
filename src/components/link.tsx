import useLanguage from "@/services/i18n/use-language";
import {
  LeavePageActionsContext,
  LeavePageContext,
} from "@/services/leave-page/leave-page-context";
// Need for leave page logic

import NextLink, { LinkProps } from "next/link";
import React, { forwardRef, useContext, ReactNode } from "react";

export interface InternalLinkProps extends LinkProps {
  children?: ReactNode;
  className?: string;
  /**
   * Menude "bu sayfadasiniz" bilgisi. Yalnizca renkle verilirse ekran
   * okuyucu kullanicisina ulasmiyor; aria-current onu <a>'nin kendisine
   * yaziyor.
   */
  "aria-current"?: React.AriaAttributes["aria-current"];
}

const Link = forwardRef<HTMLAnchorElement, InternalLinkProps>(
  function Link(props, ref) {
    const language = useLanguage();
    const { isLeavePage } = useContext(LeavePageContext);
    const { setLeavePage, openModal } = useContext(LeavePageActionsContext);
    let href = props.href;

    if (typeof href === "string" && href.startsWith("/")) {
      href = `/${language}${href}`;
    } else if (typeof href === "object" && href !== null) {
      const pathname = href.pathname
        ? `/${language}${href.pathname}`
        : href.pathname;
      href = {
        ...href,
        pathname,
      };
    }

    return (
      <NextLink
        ref={ref}
        {...props}
        href={href}
        onClick={(e) => {
          if (isLeavePage) {
            e.preventDefault();
            setLeavePage({
              [props.replace ? "replace" : "push"]: href,
            });
            openModal();
          } else {
            props.onClick?.(e);
          }
        }}
      />
    );
  }
);

export default Link;
