declare module 'launch-editor' {
  export default function launchEditor(
    file: string,
    specifiedEditor?: string,
    onErrorCallback?: (fileName: string, errorMessage: string) => void,
  ): void
}
