
export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  content?: string;
  createdAt: number;
  updatedAt: number;
}
const DB_NAME = "duckos-vfs";
const DB_VERSION = 1;
const STORE = "files";
const ROOT_ID = "root";

let dbInstance: IDBDatabase | null = null;

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("parentId", "parentId", { unique: false });
      }
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };
    req.onerror = () => reject(req.error);
  });
}
async function getById(id: string): Promise<FileNode | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as FileNode | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function putNode(node: FileNode): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(node);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function removeNode(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function getChildrenOf(parentId: string): Promise<FileNode[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("parentId");
    const req = idx.getAll(parentId);
    req.onsuccess = () => resolve(req.result as FileNode[]);
    req.onerror = () => reject(req.error);
  });
}
async function getAllNodes(): Promise<FileNode[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as FileNode[]);
    req.onerror = () => reject(req.error);
  });
}
function normalisePath(p: string): string {
  let out = p.replace(/\/+/g, "/");
  if (!out.startsWith("/")) out = "/" + out;
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}
function splitPath(p: string): string[] {
  return normalisePath(p)
    .split("/")
    .filter(Boolean);
}
export async function getNodeByPath(path: string): Promise<FileNode | undefined> {
  const segments = splitPath(path);
  if (segments.length === 0) return getById(ROOT_ID); // "/"
  let current = ROOT_ID;
  for (const seg of segments) {
    const children = await getChildrenOf(current);
    const match = children.find((c) => c.name === seg);
    if (!match) return undefined;
    current = match.id;
  }
  return getById(current);
}
async function resolveParent(path: string): Promise<[FileNode, string]> {
  const segments = splitPath(path);
  if (segments.length === 0) throw new Error("Cannot resolve parent of root");
  const childName = segments.pop()!;
  const parentPath = "/" + segments.join("/");
  const parent = await getNodeByPath(parentPath);
  if (!parent) throw new Error(`Parent path not found: ${parentPath}`);
  if (parent.type !== "folder") throw new Error(`Not a folder: ${parentPath}`);
  return [parent, childName];
}
export async function initFileSystem(): Promise<void> {
  await openDB();
  const root = await getById(ROOT_ID);
  if (root) {
    await detectAndFixCycles();
    return; 
  }
  const now = Date.now();
  const mk = (
    id: string,
    name: string,
    type: "file" | "folder",
    parentId: string | null,
    content?: string
  ): FileNode => ({ id, name, type, parentId, content, createdAt: now, updatedAt: now });
  const homeId = uid();
  const notesId = uid();
  const docsId = uid();
  const sysId = uid();
  const nodes: FileNode[] = [
    mk(ROOT_ID, "/", "folder", null),
    mk(homeId, "home", "folder", ROOT_ID),
    mk(notesId, "notes", "folder", homeId),
    mk(docsId, "documents", "folder", homeId),
    mk(sysId, "system", "folder", ROOT_ID),
    mk(uid(), "settings.json", "file", sysId, '{"theme":"midnight","locking":false}'),
  ];
  for (const n of nodes) await putNode(n);
}
export async function detectAndFixCycles(): Promise<void> {
  const all = await getAllNodes();
  const childrenMap = new Map<string, string[]>();
  for (const n of all) {
    if (n.parentId) {
      const arr = childrenMap.get(n.parentId) || [];
      arr.push(n.id);
      childrenMap.set(n.parentId, arr);
    }
  }
  async function dfs(id: string, ancestors: Set<string>) {
    if (ancestors.has(id)) {
      console.warn(`vfs: breaking cycle for node ${id}`);
      const node = await getById(id);
      if (node) {
        node.parentId = ROOT_ID;
        await putNode(node);
      }
      return;
    }
    ancestors.add(id);
    const children = childrenMap.get(id) || [];
    for (const cid of children) {
      await dfs(cid, new Set(ancestors));
    }
  }

  await dfs(ROOT_ID, new Set());
}
export async function createFile(path: string, content = ""): Promise<FileNode> {
  const [parent, name] = await resolveParent(path);
  const siblings = await getChildrenOf(parent.id);
  if (siblings.some((s) => s.name === name)) throw new Error(`Already exists: ${path}`);
  const now = Date.now();
  const node: FileNode = {
    id: uid(),
    name,
    type: "file",
    parentId: parent.id,
    content,
    createdAt: now,
    updatedAt: now,
  };
  await putNode(node);
  return node;
}
export async function createFolder(path: string): Promise<FileNode> {
  const [parent, name] = await resolveParent(path);
  const siblings = await getChildrenOf(parent.id);
  if (siblings.some((s) => s.name === name)) throw new Error(`Already exists: ${path}`);
  const now = Date.now();
  const node: FileNode = {
    id: uid(),
    name,
    type: "folder",
    parentId: parent.id,
    createdAt: now,
    updatedAt: now,
  };
  await putNode(node);
  return node;
}
export async function readFile(path: string): Promise<string> {
  const node = await getNodeByPath(path);
  if (!node) throw new Error(`Not found: ${path}`);
  if (node.type !== "file") throw new Error(`Not a file: ${path}`);
  return node.content ?? "";
}
export async function writeFile(path: string, content: string): Promise<FileNode> {
  let node = await getNodeByPath(path);
  if (node) {
    if (node.type !== "file") throw new Error(`Not a file: ${path}`);
    node = { ...node, content, updatedAt: Date.now() };
    await putNode(node);
    return node;
  }
  return createFile(path, content);
}
export async function deleteNode(path: string): Promise<void> {
  const node = await getNodeByPath(path);
  if (!node) throw new Error(`Not found: ${path}`);
  if (node.id === ROOT_ID) throw new Error("Cannot delete root");
  await deleteRecursive(node.id);
}
async function deleteRecursive(id: string): Promise<void> {
  const children = await getChildrenOf(id);
  for (const child of children) {
    await deleteRecursive(child.id);
  }
  await removeNode(id);
}
export async function moveNode(sourcePath: string, destinationPath: string): Promise<FileNode> {
  const node = await getNodeByPath(sourcePath);
  if (!node) throw new Error(`Not found: ${sourcePath}`);
  if (node.id === ROOT_ID) throw new Error("Cannot move root");
  const [newParent, newName] = await resolveParent(destinationPath);
  if (node.type === "folder") {
    let cur: FileNode | undefined | null = newParent;
    while (cur) {
      if (cur.id === node.id) {
        throw new Error("Cannot move a folder into itself or its own descendant");
      }
      cur = cur.parentId ? await getById(cur.parentId) : null;
    }
  }
  const siblings = await getChildrenOf(newParent.id);
  if (siblings.some((s) => s.name === newName && s.id !== node.id))
    throw new Error(`Already exists: ${destinationPath}`);

  const updated: FileNode = { ...node, parentId: newParent.id, name: newName, updatedAt: Date.now() };
  await putNode(updated);
  return updated;
}
export async function listDirectory(path: string): Promise<FileNode[]> {
  const node = await getNodeByPath(path);
  if (!node) throw new Error(`Not found: ${path}`);
  if (node.type !== "file" && node.type !== "folder") throw new Error(`Not a directory: ${path}`);
  if (node.type === "file") throw new Error(`Not a directory: ${path}`);

  const children = await getChildrenOf(node.id);
  // Sort: folders first, then alphabetical
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return children;
}
export async function renameNode(path: string, newName: string): Promise<FileNode> {
  const node = await getNodeByPath(path);
  if (!node) throw new Error(`Not found: ${path}`);
  if (node.id === ROOT_ID) throw new Error("Cannot rename root");
  const siblings = await getChildrenOf(node.parentId!);
  if (siblings.some((s) => s.name === newName && s.id !== node.id))
    throw new Error(`Already exists: ${newName}`);

  const updated: FileNode = { ...node, name: newName, updatedAt: Date.now() };
  await putNode(updated);
  return updated;
}
export async function getPathForNode(nodeId: string): Promise<string> {
  const parts: string[] = [];
  let current = await getById(nodeId);
  while (current && current.id !== ROOT_ID) {
    parts.unshift(current.name);
    if (current.parentId) {
      current = await getById(current.parentId);
    } else {
      break;
    }
  }
  return "/" + parts.join("/");
}
export async function getTree(path = "/"): Promise<FileNode & { children?: (FileNode & { children?: any[] })[] }> {
  const root = await getNodeByPath(path);
  if (!root) throw new Error(`Not found: ${path}`);
  const visited = new Set<string>();
  async function build(node: FileNode): Promise<FileNode & { children?: any[] }> {
    if (visited.has(node.id)) {
      return { ...node, children: [] };
    }
    visited.add(node.id);
    if (node.type === "file") {
      return node;
    }
    const children = await getChildrenOf(node.id);
    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    const childTrees = await Promise.all(
      children.map(async (child) => {
        if (child.type === "folder") {
          return build(child);
        }
        return child;
      })
    );
    return { ...node, children: childTrees };
  }
  return build(root);
}
//all cleared and generated by AI//
