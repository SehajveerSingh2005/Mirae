import EditorPageClient from "./EditorPageClient";
import { KeyboardShortcutsProvider } from "@/contexts/KeyboardShortcutsContext";

export default function MainApp() {
  return (
    <KeyboardShortcutsProvider>
      <EditorPageClient />
    </KeyboardShortcutsProvider>
  );
} 