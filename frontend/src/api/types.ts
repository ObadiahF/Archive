export type FsEntryKind = "file" | "folder"

export interface FsEntryBase {
  name: string
  path: string
  kind: FsEntryKind
  modifiedAt: number
}

export interface FsFolder extends FsEntryBase {
  kind: "folder"
}

export interface FsFile extends FsEntryBase {
  kind: "file"
  size: number
  mimeType: string
}

export type FsEntry = FsFolder | FsFile

export interface UploadProgressEvent {
  loaded: number
  total: number
}
