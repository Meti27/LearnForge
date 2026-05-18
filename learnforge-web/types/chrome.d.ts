// Minimal Chrome extension API types for use in the browser (extension-login page)
declare namespace chrome {
  namespace runtime {
    function sendMessage(
      extensionId: string,
      message: object,
      callback?: (response: any) => void
    ): void;
    const lastError: { message?: string } | undefined;
  }
}
