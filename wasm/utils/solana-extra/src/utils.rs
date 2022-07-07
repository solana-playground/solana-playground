use std::time::Duration;

use fluvio_wasm_timer::Delay;

pub async fn sleep(ms: u64) {
    Delay::new(Duration::from_millis(ms)).await.ok();
}
