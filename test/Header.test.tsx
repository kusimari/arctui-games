import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import store from "store2";
import { _resetMemory } from "../src/memory";
import { Header } from "../src/components/Header";

beforeEach(() => {
  store.clearAll();
  _resetMemory();
});

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  test("displays stored username and delete button when username is in memory", () => {
    store.set("username", { name: "Alice" });
    render(<Header label="arctui by kusimari" />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByLabelText("delete username")).toBeDefined();
  });

  test("shows name input and set button when no username is stored", () => {
    render(<Header label="arctui by kusimari" />);
    expect(screen.getByLabelText("username")).toBeDefined();
    expect(screen.getByLabelText("set username")).toBeDefined();
  });
});
