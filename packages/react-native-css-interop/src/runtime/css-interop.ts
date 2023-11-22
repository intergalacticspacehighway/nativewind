import { PropsWithChildren, createElement, forwardRef } from "react";
import {
  ComponentType,
  InteropFunction,
  RemapProps,
  StyleProp,
} from "../types";
import { getNormalizeConfig } from "./native/prop-mapping";
import { interopComponents } from "./render";

export const defaultCSSInterop: InteropFunction = (
  component,
  options,
  props,
  children,
) => {
  for (const config of options.config) {
    const key = config[0];
    const sourceProp = config[1];
    const newStyles: StyleProp = [];

    const value = props[sourceProp];
    if (typeof value === "string") {
      newStyles.push({
        $$css: true,
        [value]: value,
      } as StyleProp);
    }

    delete props[sourceProp];

    let styles: StyleProp = props[key];
    if (Array.isArray(styles)) {
      styles = [...newStyles, ...styles];
    } else if (styles) {
      styles = [...newStyles, styles];
    } else {
      styles = newStyles;
    }

    props[key] = styles;
  }

  return [component, props, children];
};

export function remapProps<P, M>(
  component: ComponentType<P>,
  mapping: RemapProps<P> & M,
) {
  const { config } = getNormalizeConfig(mapping);

  let render: any = <P extends Record<string, unknown>>(
    { ...props }: PropsWithChildren<P>,
    ref: unknown,
  ) => {
    for (const entry of config) {
      const key = entry[0];
      const sourceProp = entry[1];
      let rawStyles = [];

      const value = props?.[sourceProp];
      if (typeof value !== "string") continue;
      delete props[sourceProp];
      rawStyles.push({
        $$css: true,
        [value]: value,
      } as StyleProp);

      const existingStyle = props[key];

      if (Array.isArray(existingStyle)) {
        rawStyles.push(...existingStyle);
      } else if (existingStyle) {
        rawStyles.push(existingStyle);
      }

      (props as any)[key] = rawStyles as any;
    }

    return createElement(component as any, props, props.children);
  };

  interopComponents.set(component as any, {
    type: forwardRef(render),
    check: () => true,
    createElementWithInterop(props, children) {
      return render({ ...props, children }, null);
    },
  });
}
