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
  let mockProcessSpawner: MockProcessSpawner;

  beforeEach(() => {
    mockProcessSpawner = new MockProcessSpawner();
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("openFile", () => {
    test("should create file if it does not exist", async () => {
      const editorService = new EditorService({
        editor: "vim",
        processSpawner: mockProcessSpawner,
      });
      const testFilePath = path.join(testDir, "test-file.txt");

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      await editorService.openFile(testFilePath);

      expect(fs.existsSync(testFilePath)).toBe(true);
      expect(fs.readFileSync(testFilePath, "utf8")).toBe("");
    });

    test("should create directory structure if it does not exist", async () => {
      const editorService = new EditorService({
        editor: "vim",
        processSpawner: mockProcessSpawner,
      });
      const nestedDir = path.join(testDir, "nested", "deep", "path");
      const testFilePath = path.join(nestedDir, "test-file.txt");

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      await editorService.openFile(testFilePath);

      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.existsSync(testFilePath)).toBe(true);
    });

    test("should not modify existing file", async () => {
      const editorService = new EditorService({
        editor: "vim",
        processSpawner: mockProcessSpawner,
      });
      const testFilePath = path.join(testDir, "existing-file.txt");
      const existingContent = "This is existing content";

      // Create directory and file with content
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testFilePath, existingContent);

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      await editorService.openFile(testFilePath);

      expect(fs.readFileSync(testFilePath, "utf8")).toBe(existingContent);
    });

    test("should handle tilde path expansion", async () => {
      const editorService = new EditorService({
        editor: "vim",
        processSpawner: mockProcessSpawner,
      });
      const homeDir = os.homedir();
      const tildeFilePath = "~/test-editor-tilde.txt";
      const expandedPath = path.join(homeDir, "test-editor-tilde.txt");

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      try {
        await editorService.openFile(tildeFilePath);

        // Verify file was created in home directory
        expect(fs.existsSync(expandedPath)).toBe(true);
        expect(fs.readFileSync(expandedPath, "utf8")).toBe("");

        // Verify spawn was called with expanded path
        expect(mockProcessSpawner.spawn).toHaveBeenCalledWith(
          "vim",
          [expandedPath],
          {
            stdio: "inherit",
          },
        );
      } finally {
        // Clean up file in home directory
        if (fs.existsSync(expandedPath)) {
          fs.unlinkSync(expandedPath);
        }
      }
    });

    test("should handle tilde path with subdirectory", async () => {
      const editorService = new EditorService({
        editor: "nano",
        processSpawner: mockProcessSpawner,
      });
      const homeDir = os.homedir();
      const tildeFilePath = "~/test-editor-subdir/nested/file.txt";
      const expandedPath = path.join(
        homeDir,
        "test-editor-subdir/nested/file.txt",
      );
      const expandedDir = path.dirname(expandedPath);

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      try {
        await editorService.openFile(tildeFilePath);

        // Verify directory and file were created in home directory
        expect(fs.existsSync(expandedDir)).toBe(true);
        expect(fs.existsSync(expandedPath)).toBe(true);
        expect(fs.readFileSync(expandedPath, "utf8")).toBe("");

        // Verify spawn was called with expanded path
        expect(mockProcessSpawner.spawn).toHaveBeenCalledWith(
          "nano",
          [expandedPath],
          {
            stdio: "inherit",
          },
        );
      } finally {
        // Clean up directory in home directory
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

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      await editorService.openFile(testFilePath);

      expect(mockProcessSpawner.spawn).toHaveBeenCalledWith(
        "code",
        [testFilePath],
        {
          stdio: "inherit",
        },
      );
    });

    test("should reject when editor exits with non-zero code", async () => {
      const editorService = new EditorService({
        editor: "vim",
        processSpawner: mockProcessSpawner,
      });
      const testFilePath = path.join(testDir, "test-file.txt");

      // Mock spawn to simulate editor exit with error code
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

      // Mock spawn to simulate spawn error
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "error") {
            setTimeout(
              () => callback(new Error("ENOENT: no such file or directory")),
              0,
            );
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      await expect(editorService.openFile(testFilePath)).rejects.toThrow(
        "ENOENT: no such file or directory",
      );
    });

    test("should not recreate existing directory", async () => {
      const editorService = new EditorService({
        editor: "vim",
        processSpawner: mockProcessSpawner,
      });
      const existingDir = path.join(testDir, "existing-dir");
      const testFilePath = path.join(existingDir, "test-file.txt");

      // Pre-create directory
      fs.mkdirSync(existingDir, { recursive: true });
      const dirStats = fs.statSync(existingDir);

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      await editorService.openFile(testFilePath);

      // Verify directory still exists and wasn't modified
      expect(fs.existsSync(existingDir)).toBe(true);
      const newDirStats = fs.statSync(existingDir);
      expect(newDirStats.birthtime).toEqual(dirStats.birthtime);
    });

    test("should handle paths that do not start with tilde", async () => {
      const editorService = new EditorService({
        editor: "emacs",
        processSpawner: mockProcessSpawner,
      });
      const testFilePath = path.join(testDir, "regular-path.txt");

      // Mock spawn to simulate successful editor exit
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === "exit") {
            setTimeout(() => callback(0), 0);
          }
        }),
      };
      mockProcessSpawner.spawn.mockReturnValue(
        mockProcess as unknown as ChildProcess,
      );

      await editorService.openFile(testFilePath);

      // Verify spawn was called with original path (not expanded)
      expect(mockProcessSpawner.spawn).toHaveBeenCalledWith(
        "emacs",
        [testFilePath],
        {
          stdio: "inherit",
        },
      );
    });
  });
});
