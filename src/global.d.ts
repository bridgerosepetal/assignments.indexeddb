declare global {
  interface Window {
    db: ReturnType<typeof openDatabase>
  }
}

export {}
