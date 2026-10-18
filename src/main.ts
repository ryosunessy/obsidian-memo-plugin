import { MarkdownView, Plugin, TFile, moment, normalizePath } from "obsidian";

const INACTIVE_MS = 4 * 60 * 60 * 1000;
const SAVE_INTERVAL_MS = 60 * 1000;

interface MemoData {
  lastActive: number;
}

interface DailyNoteOptions {
  folder: string;
  format: string;
  template: string;
}

type InternalPlugins = {
  internalPlugins?: {
    getPluginById?: (
      id: string
    ) => { instance?: { options?: Partial<DailyNoteOptions> } } | undefined;
  };
};

export default class MemoPlugin extends Plugin {
  private lastActive = 0;
  private lastSaved = 0;

  async onload() {
    const data = (await this.loadData()) as Partial<MemoData> | null;
    this.lastActive = data?.lastActive ?? 0;

    this.addCommand({
      id: "open-today-daily-note",
      name: "Open today's daily note",
      callback: () => {
        void this.openToday();
      },
    });

    this.app.workspace.onLayoutReady(() => {
      void this.checkRollover();
    });

    this.registerDomEvent(document, "visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void this.checkRollover();
      } else {
        this.touch(true);
      }
    });
    this.registerDomEvent(document, "pointerdown", () => this.touch(false));
    this.registerDomEvent(document, "keydown", () => this.touch(false));
  }

  private touch(force: boolean) {
    const now = Date.now();
    this.lastActive = now;
    if (force || now - this.lastSaved >= SAVE_INTERVAL_MS) {
      this.lastSaved = now;
      void this.saveData({ lastActive: now } as MemoData);
    }
  }

  private async checkRollover() {
    const now = Date.now();
    const prev = this.lastActive;
    if (prev > 0 && now - prev >= INACTIVE_MS && !moment(prev).isSame(now, "day")) {
      await this.rollover(prev);
    }
    this.touch(true);
  }

  private async rollover(prevMs: number) {
    const opts = this.getOptions();
    const oldPath = this.pathFor(opts, moment(prevMs));
    const today = await this.getOrCreateToday(opts);

    const oldLeaves = this.app.workspace
      .getLeavesOfType("markdown")
      .filter((leaf) => leaf.view instanceof MarkdownView && leaf.view.file?.path === oldPath);

    const [first, ...rest] = oldLeaves;
    rest.forEach((leaf) => leaf.detach());
    const leaf = first ?? this.app.workspace.getLeaf(false);
    await leaf.openFile(today);
  }

  private async openToday() {
    const today = await this.getOrCreateToday(this.getOptions());
    await this.app.workspace.getLeaf(false).openFile(today);
  }

  private getOptions(): DailyNoteOptions {
    const core = (this.app as unknown as InternalPlugins).internalPlugins
      ?.getPluginById?.("daily-notes")?.instance?.options;
    return {
      folder: core?.folder ?? "",
      format: core?.format || "YYYY-MM-DD",
      template: core?.template ?? "",
    };
  }

  private pathFor(opts: DailyNoteOptions, date: moment.Moment): string {
    return normalizePath(`${opts.folder}/${date.format(opts.format)}.md`);
  }

  private async getOrCreateToday(opts: DailyNoteOptions): Promise<TFile> {
    const path = this.pathFor(opts, moment());
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;

    const dir = path.substring(0, path.lastIndexOf("/"));
    if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
      try {
        await this.app.vault.createFolder(dir);
      } catch {
        // folder may have been created in the meantime
      }
    }
    const title = path.substring(path.lastIndexOf("/") + 1).replace(/\.md$/, "");
    const content = await this.renderTemplate(opts.template, title);
    return this.app.vault.create(path, content);
  }

  private async renderTemplate(template: string, title: string): Promise<string> {
    if (!template) return "";
    const base = normalizePath(template);
    const file =
      this.app.vault.getAbstractFileByPath(base) ??
      this.app.vault.getAbstractFileByPath(`${base}.md`);
    if (!(file instanceof TFile)) return "";
    const text = await this.app.vault.cachedRead(file);
    return text
      .replace(/{{\s*(date|time)\s*(?::([^}]+?))?\s*}}/g, (_m, kind: string, fmt?: string) =>
        moment().format(fmt ?? (kind === "date" ? "YYYY-MM-DD" : "HH:mm"))
      )
      .replace(/{{\s*title\s*}}/g, title);
  }
}
