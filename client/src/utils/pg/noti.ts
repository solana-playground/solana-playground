export class PgNoti {
  private static readonly NOTI_KEY = "noti";

  static isEnabled(): boolean {
    return JSON.parse(localStorage.getItem(this.NOTI_KEY) ?? "true");
  }

  static disable() {
    localStorage.setItem(this.NOTI_KEY, JSON.stringify(false));
  }
}
