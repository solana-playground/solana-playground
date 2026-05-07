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

    db::init(&config.db_uri, config.db_name, config.db_max_connections).await?;
    info!("DB initialized (max_connections={})", config.db_max_connections);

    let app = Router::new()
        .route(
            "/build",
            post(build).with_state(BuildState::new(config.build_concurrency)),
        )
        .route("/deploy/:uuid", get(deploy))
        .route("/share/:id", get(share_get))
        .route("/new", post(share_new))
        .layer(compression())
        .layer(payload_limit(config.payload_limit))
        .layer(cors(config.client_url))
        .layer(middleware::from_fn(log));

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, config.port));
    let listener = TcpListener::bind(addr).await?;
    info!("Listening on {addr}");

    axum::serve(listener, app).await?;

    Ok(())
}
