export type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: FileNode[];
  content?: string;
};

export const nestFileSystem: FileNode = {
  id: "root",
  name: "Root",
  type: "folder",
  children: [
    {
      id: "notes",
      name: "Notes",
      type: "folder",
      children: [
        {
          id: "welcome",
          name: "welcome.txt",
          type: "file",
          content: "Welcome to Nest. This folder mirrors a simple filesystem tree.",
        },
        {
          id: "roadmap",
          name: "roadmap.md",
          type: "file",
          content: "- Build calming shell\n- Add more spatial apps\n- Keep the UI minimal",
        },
      ],
    },
    {
      id: "system",
      name: "System",
      type: "folder",
      children: [
        {
          id: "config",
          name: "config.json",
          type: "file",
          content: '{"theme":"midnight","locking":false}',
        },
      ],
    },
  ],
};
