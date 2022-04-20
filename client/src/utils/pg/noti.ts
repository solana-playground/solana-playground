const NOTI_KEY = "noti";

export class PgNoti {
  static isEnabled(): boolean {
    return JSON.parse(localStorage.getItem(NOTI_KEY) ?? "true");
  }

  static disable() {
    localStorage.setItem(NOTI_KEY, JSON.stringify(false));
  }
}
