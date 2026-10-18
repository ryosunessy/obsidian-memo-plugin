import { Editor, Plugin, moment } from "obsidian";

export default class MemoPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "append-today-date",
      name: "Append today's date to end of note",
      editorCallback: (editor: Editor) => {
        const line = moment().format("YYYY-MM-DD");
        const lastLine = editor.lastLine();
        const end = { line: lastLine, ch: editor.getLine(lastLine).length };
        const prefix = editor.getLine(lastLine) === "" ? "" : "\n";
        editor.replaceRange(`${prefix}${line}\n`, end);
      },
    });
  }
}
