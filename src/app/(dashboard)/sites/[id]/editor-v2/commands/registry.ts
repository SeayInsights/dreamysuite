export interface EditorCommand {
  id: string;
  label: string;
  group?: string;
  execute: () => void | Promise<void>;
}

const commands = new Map<string, EditorCommand>();

export function registerCommand(cmd: EditorCommand): void {
  commands.set(cmd.id, cmd);
}

export function getCommand(id: string): EditorCommand | undefined {
  return commands.get(id);
}

export function getAllCommands(): EditorCommand[] {
  return Array.from(commands.values());
}
