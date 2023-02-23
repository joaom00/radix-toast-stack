import * as React from "react";
import { useToast, Toasts } from "./Toast";
import "./styles.css";

export default function App() {
  return (
    <Toasts>
      <Page />
    </Toasts>
  );
}

const Page = () => {
  const toast = useToast();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <button
        className="Button large violet"
        onClick={() => toast({ description: prettyDate(oneWeekAway()) })}
      >
        Add to calendar (default)
      </button>
      <button
        className="Button large violet"
        onClick={() =>
          toast.success({ description: prettyDate(oneWeekAway()) })
        }
      >
        Add to calendar (success)
      </button>
      <button
        className="Button large violet"
        onClick={() => toast.error({ description: prettyDate(oneWeekAway()) })}
      >
        Add to calendar (error)
      </button>
    </div>
  );
};

function oneWeekAway() {
  const now = new Date();
  const inOneWeek = now.setDate(now.getDate() + 7);
  return new Date(inOneWeek);
}

function prettyDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}
