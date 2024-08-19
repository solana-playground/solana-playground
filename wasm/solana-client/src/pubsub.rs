use std::{collections::HashMap, sync::Arc};

use futures::lock::Mutex;
use serde::de;
use serde_json::{json, Value};
use solana_extra_wasm::{transaction_status::UiTransactionEncoding, utils::sleep};
use solana_sdk::{pubkey::Pubkey, signature::Signature};
use wasm_bindgen::{prelude::Closure, JsCast};
use wasm_bindgen_futures::spawn_local;
use web_sys::{MessageEvent, WebSocket};

use crate::{
    methods::{GetAccountInfoResponse, GetProgramAccountsResponse},
    utils::{
        rpc_config::{
            pubsub::{
                RpcAccountSubscribeConfig, RpcBlockSubscribeConfig, RpcBlockSubscribeFilter,
                RpcSignatureSubscribeConfig,
            },
            RpcProgramAccountsConfig, RpcTransactionLogsConfig, RpcTransactionLogsFilter,
        },
        rpc_response::{
            RpcBlockUpdate, RpcLogsResponse, RpcSignatureResult, RpcVote, SlotInfo, SlotUpdate,
            WithContext,
        },
    },
    ClientRequest, ClientResponse, WasmClient,
};

/// WASM compatible WebSocket.
///
/// Requires `pubsub` crate feature to be activated.
///
/// ### Compatibility
///
/// Current implementation depends on `web-sys` and `js-sys` crates and is intended to work only
/// in browsers.
pub struct WasmWebSocket {
    ws: WebSocket,
    listeners: Arc<Mutex<HashMap<SubscriptionId, Closure<dyn Fn(MessageEvent)>>>>,
}

impl WasmWebSocket {
    pub fn new<S: AsRef<str>>(url: S) -> Self {
        Self {
            ws: match url.as_ref() {
                url if url.starts_with("http") => {
                    // Replace to wss
                    let first_index = url.find(':').expect("Invalid URL");
                    let mut url = url.to_string();
                    url.replace_range(
                        ..first_index,
                        if url.starts_with("https") {
                            "wss"
                        } else {
                            "ws"
                        },
                    );

                    // Increase the port number by 1 if the port is specified
                    let last_index = url.rfind(':').unwrap();
                    if last_index != first_index {
                        if let Some(Ok(mut port)) = url
                            .get(last_index + 1..)
                            .map(|potential_port| potential_port.parse::<u16>())
                        {
                            port += 1;
                            url.replace_range(last_index + 1.., &port.to_string())
                        }
                    }

                    WebSocket::new(&url).expect("Could not create WebSocket")
                }
                _ => WebSocket::new(url.as_ref()).expect("Could not create WebSocket"),
            },
            listeners: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    async fn wait_until_ready(&self) {
        while self.ws.ready_state() != 1 {
            sleep(200).await;
        }
    }

    fn send(&self, method: &str, params: Option<Value>) {
        let mut req = ClientRequest::new(method);
        if let Some(params) = params {
            req = req.params(params);
        }
        self.ws
            .send_with_str(&serde_json::to_string(&req).unwrap())
            .ok();
    }

    async fn add_listener<'a, T: de::Deserialize<'a>, F>(
        &self,
        method: &str,
        params: Option<Value>,
        cb: F,
    ) -> SubscriptionId
    where
        F: Fn(T) + Send + 'static,
    {
        self.wait_until_ready().await;

        // Get the subscription id
        let id: Arc<Mutex<Option<SubscriptionId>>> = Arc::new(Mutex::new(None));
        let id_ref = id.clone();
        let subscription_id_listener = Closure::wrap(Box::new(move |event: MessageEvent| {
            if let Some(Ok(response)) = event
                .data()
                .as_string()
                .map(|data| serde_json::from_str::<ClientResponse<SubscriptionId>>(&data))
            {
                let id_ref = id_ref.clone();
                spawn_local(async move {
                    let subscription_id: SubscriptionId = response.result;
                    let mut id = id_ref.lock().await;
                    *id = Some(subscription_id);
                })
            }
        }) as Box<dyn Fn(MessageEvent)>);
        self.ws
            .add_event_listener_with_callback(
                "message",
                subscription_id_listener.as_ref().unchecked_ref(),
            )
            .unwrap();

        self.send(method, params);

        // Main event listener
        let listener = Closure::wrap(Box::new(move |event: MessageEvent| {
            if let Some(Ok(notification)) = event.data().as_string().map(|data| {
                // SAFETY: No segfault so far -_-
                // See https://github.com/serde-rs/serde/issues/964
                let data = unsafe { std::mem::transmute::<&str, &'a str>(&data) };
                serde_json::from_str::<SubscriptionNotification<T>>(data)
            }) {
                cb(notification.params.result);
            }
        }) as Box<dyn Fn(MessageEvent)>);
        self.ws
            .add_event_listener_with_callback("message", listener.as_ref().unchecked_ref())
            .unwrap();

        loop {
            let id = id.lock().await;
            if id.is_some() {
                self.ws
                    .remove_event_listener_with_callback(
                        "message",
                        subscription_id_listener.as_ref().unchecked_ref(),
                    )
                    .ok();

                let id = id.unwrap();

                let mut listeners = self.listeners.lock().await;
                listeners.insert(id, listener);

                return id;
            }
            drop(id);

            sleep(500).await;
        }
    }

    async fn remove_listener(&self, method: &str, id: SubscriptionId) {
        let mut listeners = self.listeners.lock().await;
        if let Some(listener) = listeners.get(&id) {
            self.ws
                .remove_event_listener_with_callback("message", listener.as_ref().unchecked_ref())
                .ok();

            listeners.remove(&id);

            self.send(method, Some(json!([id])));
        }
    }
}

pub type SubscriptionId = u64;

#[derive(Debug, Deserialize)]
pub struct SubscriptionNotification<T> {
    jsonrpc: String,
    method: String,
    params: SubscriptionParams<T>,
}

#[derive(Debug, Deserialize)]
pub struct SubscriptionParams<T> {
    result: T,
    subscription: SubscriptionId,
}

impl WasmClient {
    /// Subscribe to account events.
    ///
    /// Receives messages of type [`GetAccountInfoResponse`] when an account's lamports or data changes.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`accountSubscribe`] RPC method.
    ///
    /// [`accountSubscribe`]: https://docs.solana.com/api/websocket#accountsubscribe
    pub async fn account_subscribe<F>(&self, pubkey: Pubkey, cb: F) -> SubscriptionId
    where
        F: Fn(GetAccountInfoResponse) + Send + 'static,
    {
        self.account_subscribe_with_config(
            pubkey,
            Some(RpcAccountSubscribeConfig {
                commitment: Some(self.commitment_config()),
                encoding: Some(UiTransactionEncoding::Base64),
            }),
            cb,
        )
        .await
    }

    /// Subscribe to account events with config.
    ///
    /// Receives messages of type [`GetAccountInfoResponse`] when an account's lamports or data changes.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`accountSubscribe`] RPC method.
    ///
    /// [`accountSubscribe`]: https://docs.solana.com/api/websocket#accountsubscribe
    pub async fn account_subscribe_with_config<F>(
        &self,
        pubkey: Pubkey,
        config: Option<RpcAccountSubscribeConfig>,
        cb: F,
    ) -> SubscriptionId
    where
        F: Fn(GetAccountInfoResponse) + Send + 'static,
    {
        self.ws
            .add_listener(
                "accountSubscribe",
                Some(json!([pubkey.to_string(), config])),
                cb,
            )
            .await
    }

    /// Subscribe to block events.
    ///
    /// Receives messages of type [`RpcBlockUpdate`] when a block is confirmed or finalized.
    ///
    /// This method is disabled by default. It can be enabled by passing
    /// `--rpc-pubsub-enable-block-subscription` to `solana-validator`.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`blockSubscribe`] RPC method.
    ///
    /// [`blockSubscribe`]: https://docs.solana.com/api/websocket#blocksubscribe
    pub async fn block_subscribe<F>(
        &self,
        filter: RpcBlockSubscribeFilter,
        config: Option<RpcBlockSubscribeConfig>,
        cb: F,
    ) -> SubscriptionId
    where
        F: Fn(WithContext<RpcBlockUpdate>) + Send + 'static,
    {
        self.ws
            .add_listener("blockSubscribe", Some(json!([filter, config])), cb)
            .await
    }

    /// Subscribe to transaction log events.
    ///
    /// Receives messages of type [`RpcLogsResponse`] when a transaction is committed.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`logsSubscribe`] RPC method.
    ///
    /// [`logsSubscribe`]: https://docs.solana.com/api/websocket#logssubscribe
    pub async fn logs_subscribe<F>(
        &self,
        filter: RpcTransactionLogsFilter,
        config: RpcTransactionLogsConfig,
        cb: F,
    ) -> SubscriptionId
    where
        F: Fn(WithContext<RpcLogsResponse>) + Send + 'static,
    {
        self.ws
            .add_listener("logsSubscribe", Some(json!([filter, config])), cb)
            .await
    }

    /// Subscribe to program account events.
    ///
    /// Receives messages of type [`GetProgramAccountsResponse`] when an account owned
    /// by the given program changes.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`programSubscribe`] RPC method.
    ///
    /// [`programSubscribe`]: https://docs.solana.com/api/websocket#programsubscribe
    pub async fn program_subscribe<F>(
        &self,
        pubkey: &Pubkey,
        config: Option<RpcProgramAccountsConfig>,
        cb: F,
    ) -> SubscriptionId
    where
        F: Fn(GetProgramAccountsResponse) + Send + 'static,
    {
        self.ws
            .add_listener(
                "programSubscribe",
                Some(json!([pubkey.to_string(), config])),
                cb,
            )
            .await
    }

    /// Subscribe to vote events.
    ///
    /// Receives messages of type [`RpcVote`] when a new vote is observed. These
    /// votes are observed prior to confirmation and may never be confirmed.
    ///
    /// This method is disabled by default. It can be enabled by passing
    /// `--rpc-pubsub-enable-vote-subscription` to `solana-validator`.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`voteSubscribe`] RPC method.
    ///
    /// [`voteSubscribe`]: https://docs.solana.com/api/websocket#votesubscribe
    pub async fn vote_subscribe<F>(&self, cb: F) -> SubscriptionId
    where
        F: Fn(RpcVote) + Send + 'static,
    {
        self.ws.add_listener("voteSubscribe", None, cb).await
    }

    // Subscribe to transaction confirmation events.
    ///
    /// Receives messages of type [`RpcSignatureResult`] when a transaction
    /// with the given signature is committed.
    ///
    /// This is a subscription to a single notification. It is automatically
    /// cancelled by the server once the notification is sent.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`signatureSubscribe`] RPC method.
    ///
    /// [`signatureSubscribe`]: https://docs.solana.com/api/websocket#signaturesubscribe
    pub async fn signature_subscribe<F>(
        &self,
        signature: &Signature,
        config: Option<RpcSignatureSubscribeConfig>,
        cb: F,
    ) -> SubscriptionId
    where
        F: Fn(WithContext<RpcSignatureResult>) + Send + 'static,
    {
        self.ws
            .add_listener(
                "signatureSubscribe",
                Some(json!([signature.to_string(), config])),
                cb,
            )
            .await
    }

    /// Subscribe to slot events.
    ///
    /// Receives messages of type [`SlotInfo`] when a slot is processed.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`slotSubscribe`] RPC method.
    ///
    /// [`slotSubscribe`]: https://docs.solana.com/api/websocket#slotsubscribe
    pub async fn slot_subscribe<F>(&self, cb: F) -> SubscriptionId
    where
        F: Fn(SlotInfo) + Send + 'static,
    {
        self.ws.add_listener("slotSubscribe", None, cb).await
    }

    /// Subscribe to slot update events.
    ///
    /// Receives messages of type [`SlotUpdate`] when various updates to a slot occur.
    ///
    /// Note that this method operates differently than other subscriptions:
    /// instead of sending the message to a reciever on a channel, it accepts a
    /// `handler` callback that processes the message directly. This processing
    /// occurs on another thread.
    ///
    /// # RPC Reference
    ///
    /// This method corresponds directly to the [`slotUpdatesSubscribe`] RPC method.
    ///
    /// [`slotUpdatesSubscribe`]: https://docs.solana.com/api/websocket#slotsubscribe
    pub async fn slot_updates_subscribe<F>(&self, cb: F) -> SubscriptionId
    where
        F: Fn(SlotUpdate) + Send + 'static,
    {
        self.ws
            .add_listener("slotsUpdatesSubscribe", None, cb)
            .await
    }

    /// Unsubscribe from account update events.
    pub async fn account_unsubscribe(&self, id: SubscriptionId) {
        self.ws.remove_listener("accountUnsubscribe", id).await;
    }

    /// Unsubscribe from block update events.
    pub async fn block_unsubscribe(&self, id: SubscriptionId) {
        self.ws.remove_listener("blockUnsubscribe", id).await;
    }

    /// Unsubscribe from logs update events.
    pub async fn logs_unsubscribe(&self, id: SubscriptionId) {
        self.ws.remove_listener("logsUnsubscribe", id).await;
    }

    /// Unsubscribe from program update events.
    pub async fn program_unsubscribe(&self, id: SubscriptionId) {
        self.ws.remove_listener("programUnsubscribe", id).await;
    }

    /// Unsubscribe from signature update events.
    pub async fn signature_unsubscribe(&self, id: SubscriptionId) {
        self.ws.remove_listener("signatureUnsubscribe", id).await;
    }

    /// Unsubscribe from slot update events.
    pub async fn slot_unsubscribe(&self, id: SubscriptionId) {
        self.ws.remove_listener("slotUnsubscribe", id).await;
    }

    /// Unsubscribe from vote update events.
    pub async fn vote_unsubscribe(&self, id: SubscriptionId) {
        self.ws.remove_listener("voteUnsubscribe", id).await;
    }
}

#[cfg(test)]
wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

#[cfg(test)]
pub mod test {
    use solana_sdk::{native_token::LAMPORTS_PER_SOL, signature::Keypair, signer::Signer};
    use wasm_bindgen_test::*;

    use super::*;

    #[wasm_bindgen_test]
    async fn account() {
        // Create a client
        let client = WasmClient::new("http://localhost:8899");

        let random_pubkey = Keypair::new().pubkey();
        client
            .request_airdrop(&random_pubkey, 1 * LAMPORTS_PER_SOL)
            .await
            .expect("Airdrop failed");

        // Subscribe to changes
        let id = client
            .account_subscribe(random_pubkey, |response| {
                if let Some(account) = response.value {
                    console_log!("Account: {:#?}", account);
                }
            })
            .await;

        sleep(5000).await;

        // Must unsubscribe to not leak memory
        client.account_unsubscribe(id).await;
    }

    #[wasm_bindgen_test]
    async fn slot() {
        // Create a client
        let client = WasmClient::new("https://api.devnet.solana.com");

        // Subscribe to changes
        let id = client
            .slot_subscribe(|slot_info| {
                console_log!("Slot info: {:#?}", slot_info);
            })
            .await;

        sleep(5000).await;

        // Must unsubscribe to not leak memory
        client.slot_unsubscribe(id).await;
    }
}
