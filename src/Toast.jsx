// Credits: https://github.com/2nthony/vercel-toast

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { Cross2Icon } from "@radix-ui/react-icons";
import { CheckmarkIcon } from "./CheckmarkIcon";
import { ErrorIcon } from "./ErrorIcon";

const ToastContext = React.createContext();
const ToastContextImpl = React.createContext();

export const Toasts = ({ children, ...props }) => {
  const [toasts, setToasts] = React.useState(new Map());
  const toastElementsMapRef = React.useRef(new Map());
  const viewportRef = React.useRef();

  const sortToasts = React.useCallback(() => {
    const toastElements = Array.from(toastElementsMapRef.current).reverse();
    const heights = [];

    toastElements.forEach(([, toast], index) => {
      if (!toast) return;
      const height = toast.clientHeight;
      heights.push(height);
      const frontToastHeight = heights[0];
      toast.setAttribute("data-front", index === 0);
      toast.setAttribute("data-hidden", index > 2);
      toast.style.setProperty("--index", index);
      toast.style.setProperty("--height", `${height}px`);
      toast.style.setProperty("--front-height", `${frontToastHeight}px`);
      const hoverOffsetY = heights
        .slice(0, index)
        .reduce((res, next) => (res += next), 0);
      toast.style.setProperty("--hover-offset-y", `-${hoverOffsetY}px`);
    });
  }, []);

  const handleAddToast = React.useCallback((toast) => {
    setToasts((currentToasts) => {
      const newMap = new Map(currentToasts);
      newMap.set(String(Date.now()), { ...toast, open: true });
      return newMap;
    });
  }, []);

  const handleRemoveToast = React.useCallback((key) => {
    setToasts((currentToasts) => {
      const newMap = new Map(currentToasts);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const handleDispatchDefault = React.useCallback(
    (payload) => handleAddToast({ ...payload, status: "default" }),
    [handleAddToast]
  );

  const handleDispatchSuccess = React.useCallback(
    (payload) => handleAddToast({ ...payload, status: "success" }),
    [handleAddToast]
  );

  const handleDispatchError = React.useCallback(
    (payload) => handleAddToast({ ...payload, status: "error" }),
    [handleAddToast]
  );

  React.useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport) {
      const handlePointerEnter = () => {
        toastElementsMapRef.current.forEach((toast) => {
          toast.setAttribute("data-hovering", "true");
        });
      };

      const handlePointerLeave = () => {
        toastElementsMapRef.current.forEach((toast) => {
          toast.setAttribute("data-hovering", "false");
        });
      };

      viewport.addEventListener("mouseenter", handlePointerEnter);
      viewport.addEventListener("mouseleave", handlePointerLeave);
      return () => {
        viewport.removeEventListener("mouseenter", handlePointerEnter);
        viewport.removeEventListener("mouseleave", handlePointerLeave);
      };
    }
  }, []);

  return (
    <ToastContext.Provider
      value={React.useMemo(
        () =>
          Object.assign(handleDispatchDefault, {
            success: handleDispatchSuccess,
            error: handleDispatchError
          }),
        [handleDispatchDefault, handleDispatchSuccess, handleDispatchError]
      )}
    >
      <ToastContextImpl.Provider
        value={React.useMemo(
          () => ({
            toastElementsMapRef,
            sortToasts,
            handleRemoveToast
          }),
          [sortToasts, handleRemoveToast]
        )}
      >
        <ToastPrimitive.Provider {...props}>
          {children}
          {Array.from(toasts).map(([key, toast]) => (
            <Toast
              key={key}
              id={key}
              toast={toast}
              onOpenChange={(open) => {
                if (!open) {
                  toastElementsMapRef.current.delete(key);
                  sortToasts();
                }
              }}
            />
          ))}
          <ToastPrimitive.Viewport
            ref={viewportRef}
            className="ToastViewport"
          />
        </ToastPrimitive.Provider>
      </ToastContextImpl.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context) return context;
  throw new Error("useToast must be used within Toasts");
};
export const useToastContext = () => {
  const context = React.useContext(ToastContextImpl);
  if (context) return context;
  throw new Error("useToast must be used within Toasts");
};

const Toast = (props) => {
  const { onOpenChange, toast, id, ...toastProps } = props;
  const [open, setOpen] = React.useState(toast.open);
  const ref = React.useRef();
  const context = useToastContext();
  const { sortToasts, toastElementsMapRef, handleRemoveToast } = context;
  const toastElementsMap = toastElementsMapRef.current;

  React.useLayoutEffect(() => {
    if (ref.current) {
      toastElementsMap.set(id, ref.current);
      sortToasts();
    }
  }, [id, sortToasts, toastElementsMap]);

  React.useEffect(() => {
    if (!open) {
      handleRemoveToast(id);
    }
  }, [open, id, handleRemoveToast]);

  return (
    <ToastPrimitive.Root
      {...toastProps}
      type={toast.type}
      duration={toast.duration}
      className="ToastRoot"
      ref={ref}
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        onOpenChange(open);
      }}
    >
      <div className="ToastInner" data-status={toast.status}>
        <ToastStatusIcon status={toast.status} />
        <ToastPrimitive.Title className="ToastTitle">
          <p>Scheduled: Catch up</p>
        </ToastPrimitive.Title>
        <ToastPrimitive.Description className="ToastDescription">
          {toast.description}
        </ToastPrimitive.Description>
        <ToastPrimitive.Action
          className="ToastAction Button small green"
          altText="Goto schedule to undo"
        >
          Undo
        </ToastPrimitive.Action>
        <ToastPrimitive.Close aria-label="Close" className="ToastClose">
          <Cross2Icon />
        </ToastPrimitive.Close>
      </div>
    </ToastPrimitive.Root>
  );
};

const ToastStatusIcon = ({ status }) => {
  return status !== "default" ? (
    <div style={{ gridArea: "icon", alignSelf: "start" }}>
      {status === "success" && <CheckmarkIcon />}
      {status === "error" && <ErrorIcon />}
    </div>
  ) : null;
};
