/// Whether `id` is in the legacy 24-char hex (mongo ObjectId) format.
pub(super) fn is_legacy_id(id: &str) -> bool {
    id.len() == 24 && id.chars().all(|c| c.is_ascii_hexdigit())
}

#[cfg(test)]
mod tests {
    use super::is_legacy_id;

    #[test]
    fn accepts_production_legacy_ids() {
        assert!(is_legacy_id("507f1f77bcf86cd799439011"));
        assert!(is_legacy_id("69fd158574a75cd49b9875f3"));
    }

    #[test]
    fn rejects_wrong_length() {
        assert!(!is_legacy_id("507f1f77bcf86cd79943901")); // 23 chars
    }

    #[test]
    fn rejects_non_hex() {
        assert!(!is_legacy_id("ABCDEFGHIJKLMNOPQRSTUVWX"));
    }
}
