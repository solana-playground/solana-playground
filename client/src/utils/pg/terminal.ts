enum TextState {
  SUCCESS = 0,
  ERROR = 1,
  WARNING = 2,
  INFO = 3,
}

interface TextInfo {
  text: string;
  state: TextState;
}

export class PgTerminal {
  private static TEXTS: TextInfo[] = [
    { text: "Compiling", state: TextState.INFO },
    { text: "Finished", state: TextState.SUCCESS },
    { text: "warning", state: TextState.WARNING },
    { text: "error", state: TextState.ERROR },
    { text: "Deploying...", state: TextState.INFO },
    { text: "Deployment successful.", state: TextState.SUCCESS },
    { text: "passed", state: TextState.SUCCESS },
    { text: "failed", state: TextState.ERROR },
  ];

  static colorText(text: string) {
    for (const textInfo of this.TEXTS) {
      text = text.replaceAll(textInfo.text, this.getColorFromState(textInfo));
    }

    return text;
  }

  static getColorFromState(textInfo: TextInfo) {
    switch (textInfo.state) {
      case TextState.SUCCESS:
        return this.success(textInfo.text);
      case TextState.ERROR:
        return this.error(textInfo.text);
      case TextState.WARNING:
        return this.warning(textInfo.text);
      case TextState.INFO:
        return this.info(textInfo.text);
      default:
        return textInfo.text;
    }
  }

  static success(text: string) {
    return `\x1B[1;32m${text}\x1B[0m`;
  }

  static error(text: string) {
    return `\x1B[1;31m${text}\x1B[0m`;
  }

  static warning(text: string) {
    return `\x1B[1;33m${text}\x1B[0m`;
  }

  static info(text: string) {
    return `\x1B[1;34m${text}\x1B[0m`;
  }

  static bold(text: string) {
    return `\x1B[1m${text}\x1B[0m`;
  }

  static editStderr = (stderr: string, uuid: string) => {
    // Remove full path
    stderr = stderr.replace(/\s\(\/home.+?(?=\s)/g, "");

    // Remove uuid from folders
    stderr = stderr.replaceAll(uuid, "");

    // Remove rustc error line
    const startIndex = stderr.indexOf("For more");
    if (startIndex !== -1) {
      const endIndex = stderr.indexOf(".", startIndex);
      stderr = stderr.substring(0, startIndex) + stderr.substring(endIndex + 2);
    }

    return stderr;
  };
}
