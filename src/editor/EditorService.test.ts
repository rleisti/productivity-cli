import { EditorService } from "./EditorService";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { ChildProcess } from "node:child_process";
import { ProcessSpawner } from "./ProcessSpawner";

class MockProcessSpawner implements ProcessSpawner {
  public spawn = jest.fn();
}

describe("EditorService", () => {
  const testDir = path.join("testResource", "temp", "editor");
  const mockProcess = {
    on: jest.fn((event, callback) => {
      if (event === "exit") {
        setTimeout(() => callback(0), 0);
      }
    }),
  };
  let mockProcessSpawner: MockProcessSpawner;
  let editorService: EditorService;

  beforeEach(() => {
    mockProcessSpawner = new MockProcessSpawner();
    mockProcessSpawner.spawn.mockReturnValue(
      mockProcess as unknown as ChildProcess,
    );
    editorService = new EditorService({
      editor: "vim",
      processSpawner: mockProcessSpawner,
    });
    cleanTestDirectory();
  });

  afterEach(() => {
    cleanTestDirectory();
  });

  describe("openFile", () => {
    test("should create file if it does not exist", async () => {
      const testFilePath = path.join(testDir, "test-file.txt");
      await editorService.openFile(testFilePath);
      expect(fs.existsSync(testFilePath)).toBe(true);
      expect(fs.readFileSync(testFilePath, "utf8")).toBe("");
    });

    test("should create directory structure if it does not exist", async () => {
      const nestedDir = path.join(testDir, "nested", "deep", "path");
      const testFilePath = path.join(nestedDir, "test-file.txt");
      await editorService.openFile(testFilePath);
      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.existsSync(testFilePath)).toBe(true);
    });

    test("should not modify existing file", async () => {
      const testFilePath = path.join(testDir, "existing-file.txt");
      const existingContent = "This is existing content";
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testFilePath, existingContent);
      await editorService.openFile(testFilePath);
      expect(fs.readFileSync(testFilePath, "utf8")).toBe(existingContent);
    });

    test("should handle tilde path expansion", async () => {
      const homeDir = os.homedir();
      const tildeFilePath = "~/test-editor-tilde.txt";
      const expandedPath = path.join(homeDir, "test-editor-tilde.txt");
      try {
        await editorService.openFile(tildeFilePath);
        expect(fs.existsSync(expandedPath)).toBe(true);
        expect(fs.readFileSync(expandedPath, "utf8")).toBe("");
        assertEditorWasInvoked(expandedPath);
      } finally {
        if (fs.existsSync(expandedPath)) {
          fs.unlinkSync(expandedPath);
        }
      }
    });

    test("should handle tilde path with subdirectory", async () => {
      const homeDir = os.homedir();
      const tildeFilePath = "~/test-editor-subdir/nested/file.txt";
      const expandedPath = path.join(
        homeDir,
        "test-editor-subdir/nested/file.txt",
      );
      const expandedDir = path.dirname(expandedPath);
      try {
        await editorService.openFile(tildeFilePath);
        expect(fs.existsSync(expandedDir)).toBe(true);
        expect(fs.existsSync(expandedPath)).toBe(true);
        expect(fs.readFileSync(expandedPath, "utf8")).toBe("");
        assertEditorWasInvoked(expandedPath);
      } finally {
        const cleanupDir = path.join(homeDir, "test-editor-subdir");
        if (fs.existsSync(cleanupDir)) {
          fs.rmSync(cleanupDir, { recursive: true, force: true });
        }
      }
    });

    test("should call spawn with correct editor and file path", async () => {
      const editorService = new EditorService({
        editor: "code",
        processSpawner: mockProcessSpawner,
      });
      const testFilePath = path.join(testDir, "test-file.txt");
      await editorService.openFile(testFilePath);
      assertEditorWasInvoked(testFilePath, "code");
    });

    test("should reject when editor exits with non-zero code", async () => {
      const testFilePath = path.join(testDir, "test-file.txt");
      mockFailedSpawn();
      await expect(editorService.openFile(testFilePath)).rejects.toThrow(
        "Editor exited with code 1",
      );
    });

    test("should reject when editor process fails to spawn", async () => {
      const editorService = new EditorService({
        editor: "invalid-editor",
        processSpawner: mockProcessSpawner,
      });
      const testFilePath = path.join(testDir, "test-file.txt");
      mockSpawnError("ENOENT: no such file or directory");
      await expect(editorService.openFile(testFilePath)).rejects.toThrow(
        "ENOENT: no such file or directory",
      );
    });

    test("should not recreate existing directory", async () => {
      const existingDir = path.join(testDir, "existing-dir");
      const testFilePath = path.join(existingDir, "test-file.txt");
      fs.mkdirSync(existingDir, { recursive: true });
      const dirStats = fs.statSync(existingDir);
      await editorService.openFile(testFilePath);
      expect(fs.existsSync(existingDir)).toBe(true);
      const newDirStats = fs.statSync(existingDir);
      expect(newDirStats.birthtime).toEqual(dirStats.birthtime);
    });

    test("should handle paths that do not start with tilde", async () => {
      const testFilePath = path.join(testDir, "regular-path.txt");
      await editorService.openFile(testFilePath);
      assertEditorWasInvoked(testFilePath);
    });
  });

  function assertEditorWasInvoked(
    testFilePath: string,
    editor: string = "vim",
  ) {
    expect(mockProcessSpawner.spawn).toHaveBeenCalledWith(
      editor,
      [testFilePath],
      {
        stdio: "inherit",
      },
    );
  }

  function mockFailedSpawn() {
    const mockProcess = {
      on: jest.fn((event, callback) => {
        if (event === "exit") {
          setTimeout(() => callback(1), 0);
        }
      }),
    };
    mockProcessSpawner.spawn.mockReturnValue(
      mockProcess as unknown as ChildProcess,
    );
  }

  function mockSpawnError(error: string) {
    const mockProcess = {
      on: jest.fn((event, callback) => {
        if (event === "error") {
          setTimeout(() => callback(new Error(error)), 0);
        }
      }),
    };
    mockProcessSpawner.spawn.mockReturnValue(
      mockProcess as unknown as ChildProcess,
    );
  }

  function cleanTestDirectory() {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
});
