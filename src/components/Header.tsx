import { useState } from "react";
import { getMemory } from "../memory";

type UsernameRecord = { name?: string };

export function Header() {
  const r = getMemory().get<UsernameRecord>("username");
  const [name, setName] = useState<string | null>(
    r.isOk() && r.value.name ? r.value.name : null,
  );
  const [input, setInput] = useState("");

  function handleSet() {
    const trimmed = input.trim();
    if (!trimmed) return;
    getMemory().set("username", { name: trimmed });
    setName(trimmed);
    setInput("");
  }

  function handleDelete() {
    if (!window.confirm(`Remove player "${name}"?`)) return;
    getMemory().delete("username");
    setName(null);
  }

  return (
    <header>
      <span>arctui</span>
      <div className="header-user">
        {name ? (
          <>
            <span>{name}</span>
            <button onClick={handleDelete} aria-label="delete username">✕</button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSet()}
              placeholder="enter name"
              aria-label="username"
            />
            <button onClick={handleSet} aria-label="set username">✓</button>
          </>
        )}
      </div>
    </header>
  );
}
