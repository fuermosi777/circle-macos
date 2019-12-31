class Logger {
  constructor() {
    // amplitude.getInstance().init(keys.AMPLITUDE_API_KEY);
    // this.setupUniqueId();
  }

  error(...message: any) {
    console.error(message);
  }

  info(...message: any) {
    console.info(message);
  }

  warn(...message: any) {
    console.warn(message);
  }
}

const logger = new Logger();

export { logger };
