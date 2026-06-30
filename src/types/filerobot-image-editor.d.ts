declare module "filerobot-image-editor" {
  import type { ComponentType } from "react";

  export interface FilerobotImageEditorCompleteResult {
    status?: string;
    canvas?: HTMLCanvasElement;
    imageMime?: string;
    imageName?: string;
  }

  export interface FilerobotImageEditorProps {
    show?: boolean;
    src?: string | Blob;
    config?: {
      tools?: string[];
      [key: string]: unknown;
    };
    closeOnLoad?: boolean;
    onOpen?: (src?: string | Blob) => void;
    onBeforeComplete?: (result: FilerobotImageEditorCompleteResult) => boolean | void;
    onComplete?: (result: FilerobotImageEditorCompleteResult, file?: unknown) => void;
    onClose?: (result: { status: string }) => void;
    onError?: (error: unknown) => void;
  }

  const FilerobotImageEditor: ComponentType<FilerobotImageEditorProps>;

  export default FilerobotImageEditor;
}
