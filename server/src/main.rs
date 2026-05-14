mod config;
mod db;
mod error;
mod log;
mod middlewares;
mod program;
mod routes;

use std::net::{Ipv4Addr, SocketAddr};

use anyhow::Result;
use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use tokio::net::TcpListener;

use self::{config::Config, log::info, middlewares::*, routes::*};

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::from_env();
    log::init(config.verbose);
    info!("Config loaded: {config:#?}");

    if config.api_keys.is_empty() {
        info!("API-key gate disabled");
    } else {
        info!("{} API key(s) configured", config.api_keys.len());
    }

    db::init(&config.db_uri, config.db_name).await?;
    info!("DB initialized");

    // API routes — protected by the optional API-key gate.
    let protected = Router::new()
        .route(
            "/build",
            post(build).with_state(BuildState::new(config.build_concurrency)),
        )
        .route("/deploy/{uuid}", get(deploy))
        .route("/share/{id}", get(share_get))
        .route("/new", post(share_new))
        .layer(middleware::from_fn_with_state(config.api_keys, api_key));

    // Health route outside the gate — App Engine Flex probes `/` unauthenticated.
    let app = Router::new()
        .route("/", get(|| async { "OK" }))
        .merge(protected)
        .layer(compression())
        .layer(payload_limit(config.payload_limit))
        .layer(cors(config.client_urls))
        .layer(middleware::from_fn(log));

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, config.port));
    let listener = TcpListener::bind(addr).await?;
    info!("Listening on {addr}");

    axum::serve(listener, app).await?;

    Ok(())
}
